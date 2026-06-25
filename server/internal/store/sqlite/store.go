package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/starazzip/cocos-automation-testing-demo/server/internal/domain"
	_ "modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
}

func Open(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)

	store := &Store{db: db}
	if err := store.migrate(context.Background()); err != nil {
		_ = db.Close()
		return nil, err
	}
	return store, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) migrate(ctx context.Context) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS players (
			id TEXT PRIMARY KEY,
			balance INTEGER NOT NULL CHECK (balance >= 0),
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			player_id TEXT NOT NULL,
			type TEXT NOT NULL,
			amount INTEGER NOT NULL,
			balance_after INTEGER NOT NULL,
			created_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS spins (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			player_id TEXT NOT NULL,
			bet INTEGER NOT NULL,
			win INTEGER NOT NULL,
			board_json TEXT NOT NULL,
			lines_json TEXT NOT NULL,
			balance_after INTEGER NOT NULL,
			created_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS game_settings (
			id TEXT PRIMARY KEY,
			symbols_json TEXT NOT NULL,
			reels_json TEXT NOT NULL,
			paytable_json TEXT NOT NULL,
			bet_options_json TEXT NOT NULL,
			default_bet INTEGER NOT NULL,
			credit_in INTEGER NOT NULL,
			local_player TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);`,
	}
	for _, statement := range statements {
		if _, err := s.db.ExecContext(ctx, statement); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) EnsureDefaults(ctx context.Context, config domain.Config) error {
	if err := config.Validate(); err != nil {
		return err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer rollback(tx)

	now := time.Now().UTC().Format(time.RFC3339Nano)
	if _, err := tx.ExecContext(ctx, `
		INSERT OR IGNORE INTO players (id, balance, created_at, updated_at)
		VALUES (?, 0, ?, ?);
	`, config.LocalPlayer, now, now); err != nil {
		return err
	}

	count, err := rowCount(ctx, tx, `SELECT COUNT(*) FROM game_settings WHERE id = 'default';`)
	if err != nil {
		return err
	}
	if count == 0 {
		symbols, reels, payTable, betOptions, err := marshalConfig(config)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO game_settings (
				id, symbols_json, reels_json, paytable_json, bet_options_json,
				default_bet, credit_in, local_player, updated_at
			)
			VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?);
		`, symbols, reels, payTable, betOptions, config.DefaultBet, config.CreditIn, config.LocalPlayer, now); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *Store) Config(ctx context.Context) (domain.Config, error) {
	var symbolsJSON, reelsJSON, payTableJSON, betOptionsJSON string
	config := domain.Config{}
	err := s.db.QueryRowContext(ctx, `
		SELECT symbols_json, reels_json, paytable_json, bet_options_json,
			default_bet, credit_in, local_player
		FROM game_settings
		WHERE id = 'default';
	`).Scan(
		&symbolsJSON,
		&reelsJSON,
		&payTableJSON,
		&betOptionsJSON,
		&config.DefaultBet,
		&config.CreditIn,
		&config.LocalPlayer,
	)
	if err != nil {
		return domain.Config{}, err
	}
	if err := json.Unmarshal([]byte(symbolsJSON), &config.Symbols); err != nil {
		return domain.Config{}, err
	}
	if err := json.Unmarshal([]byte(reelsJSON), &config.Reels); err != nil {
		return domain.Config{}, err
	}
	if err := json.Unmarshal([]byte(payTableJSON), &config.PayTable); err != nil {
		return domain.Config{}, err
	}
	if err := json.Unmarshal([]byte(betOptionsJSON), &config.BetOptions); err != nil {
		return domain.Config{}, err
	}
	if err := config.Validate(); err != nil {
		return domain.Config{}, err
	}
	return config, nil
}

func (s *Store) Balance(ctx context.Context, playerID string) (int64, error) {
	var balance int64
	err := s.db.QueryRowContext(ctx, `SELECT balance FROM players WHERE id = ?;`, playerID).Scan(&balance)
	return balance, err
}

func (s *Store) CreditIn(ctx context.Context, playerID string, amount int64) (int64, error) {
	if amount <= 0 {
		return 0, domain.ErrInvalidAmount
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer rollback(tx)

	balance, err := txBalance(ctx, tx, playerID)
	if err != nil {
		return 0, err
	}
	balance += amount
	now := time.Now().UTC().Format(time.RFC3339Nano)
	if _, err := tx.ExecContext(ctx, `UPDATE players SET balance = ?, updated_at = ? WHERE id = ?;`, balance, now, playerID); err != nil {
		return 0, err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO transactions (player_id, type, amount, balance_after, created_at)
		VALUES (?, 'credit_in', ?, ?, ?);
	`, playerID, amount, balance, now); err != nil {
		return 0, err
	}
	return balance, tx.Commit()
}

func (s *Store) CreditOut(ctx context.Context, playerID string) (int64, int64, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, 0, err
	}
	defer rollback(tx)

	balance, err := txBalance(ctx, tx, playerID)
	if err != nil {
		return 0, 0, err
	}
	paidOut := balance
	now := time.Now().UTC().Format(time.RFC3339Nano)
	if _, err := tx.ExecContext(ctx, `UPDATE players SET balance = 0, updated_at = ? WHERE id = ?;`, now, playerID); err != nil {
		return 0, 0, err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO transactions (player_id, type, amount, balance_after, created_at)
		VALUES (?, 'credit_out', ?, 0, ?);
	`, playerID, paidOut, now); err != nil {
		return 0, 0, err
	}
	return paidOut, 0, tx.Commit()
}

func (s *Store) ApplySpin(ctx context.Context, playerID string, evaluation domain.SpinEvaluation) (int64, int64, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, 0, err
	}
	defer rollback(tx)

	balance, err := txBalance(ctx, tx, playerID)
	if err != nil {
		return 0, 0, err
	}
	if balance < evaluation.Bet {
		return 0, 0, domain.ErrInsufficientBalance
	}
	afterBet := balance - evaluation.Bet
	balance = afterBet + evaluation.Win

	boardJSON, err := json.Marshal(evaluation.Board)
	if err != nil {
		return 0, 0, err
	}
	linesJSON, err := json.Marshal(evaluation.Lines)
	if err != nil {
		return 0, 0, err
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)
	if _, err := tx.ExecContext(ctx, `UPDATE players SET balance = ?, updated_at = ? WHERE id = ?;`, balance, now, playerID); err != nil {
		return 0, 0, err
	}
	result, err := tx.ExecContext(ctx, `
		INSERT INTO spins (player_id, bet, win, board_json, lines_json, balance_after, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?);
	`, playerID, evaluation.Bet, evaluation.Win, string(boardJSON), string(linesJSON), balance, now)
	if err != nil {
		return 0, 0, err
	}
	spinID, err := result.LastInsertId()
	if err != nil {
		return 0, 0, err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO transactions (player_id, type, amount, balance_after, created_at)
		VALUES (?, 'spin_bet', ?, ?, ?), (?, 'spin_win', ?, ?, ?);
	`, playerID, -evaluation.Bet, afterBet, now, playerID, evaluation.Win, balance, now); err != nil {
		return 0, 0, err
	}
	return balance, spinID, tx.Commit()
}

func marshalConfig(config domain.Config) (string, string, string, string, error) {
	symbols, err := json.Marshal(config.Symbols)
	if err != nil {
		return "", "", "", "", err
	}
	reels, err := json.Marshal(config.Reels)
	if err != nil {
		return "", "", "", "", err
	}
	payTable, err := json.Marshal(config.PayTable)
	if err != nil {
		return "", "", "", "", err
	}
	betOptions, err := json.Marshal(config.BetOptions)
	if err != nil {
		return "", "", "", "", err
	}
	return string(symbols), string(reels), string(payTable), string(betOptions), nil
}

func txBalance(ctx context.Context, tx *sql.Tx, playerID string) (int64, error) {
	var balance int64
	err := tx.QueryRowContext(ctx, `SELECT balance FROM players WHERE id = ?;`, playerID).Scan(&balance)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, fmt.Errorf("player %q not found", playerID)
	}
	return balance, err
}

func rowCount(ctx context.Context, tx *sql.Tx, query string) (int, error) {
	var count int
	err := tx.QueryRowContext(ctx, query).Scan(&count)
	return count, err
}

func rollback(tx *sql.Tx) {
	_ = tx.Rollback()
}
