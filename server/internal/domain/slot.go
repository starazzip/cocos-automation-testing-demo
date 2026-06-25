package domain

import (
	"fmt"
	"math/rand"
)

type Symbol string

type Board [3][3]Symbol

type Config struct {
	Symbols     []Symbol
	Reels       [][]Symbol
	PayTable    map[Symbol]int64
	BetOptions  []int64
	DefaultBet  int64
	CreditIn    int64
	LocalPlayer string
}

type PaylineWin struct {
	Row    int    `json:"row"`
	Symbol Symbol `json:"symbol"`
	Count  int    `json:"count"`
	Win    int64  `json:"win"`
}

type SpinEvaluation struct {
	Board Board
	Bet   int64
	Win   int64
	Lines []PaylineWin
}

func DefaultConfig() Config {
	return Config{
		Symbols: []Symbol{"A", "K", "Q", "J", "7"},
		Reels: [][]Symbol{
			{"A", "K", "Q", "J", "7", "A", "Q", "K"},
			{"K", "A", "J", "Q", "7", "K", "A", "J"},
			{"Q", "K", "A", "7", "J", "Q", "K", "A"},
		},
		PayTable: map[Symbol]int64{
			"7": 20,
			"A": 10,
			"K": 5,
			"Q": 3,
			"J": 2,
		},
		BetOptions:  []int64{1, 5, 10},
		DefaultBet:  1,
		CreditIn:    100,
		LocalPlayer: "local-player",
	}
}

func (c Config) Validate() error {
	if c.LocalPlayer == "" {
		return fmt.Errorf("local player is required")
	}
	if c.CreditIn <= 0 {
		return fmt.Errorf("credit-in default must be positive")
	}
	if !c.ValidBet(c.DefaultBet) {
		return fmt.Errorf("default bet %d is not in bet options", c.DefaultBet)
	}
	if len(c.Reels) != 3 {
		return fmt.Errorf("expected 3 reels, got %d", len(c.Reels))
	}
	for i, reel := range c.Reels {
		if len(reel) < 3 {
			return fmt.Errorf("reel %d must contain at least 3 symbols", i)
		}
		for _, symbol := range reel {
			if symbol == "" {
				return fmt.Errorf("reel %d contains an empty symbol", i)
			}
		}
	}
	if len(c.PayTable) == 0 {
		return fmt.Errorf("pay table is required")
	}
	for symbol, payout := range c.PayTable {
		if symbol == "" {
			return fmt.Errorf("pay table contains an empty symbol")
		}
		if payout <= 0 {
			return fmt.Errorf("pay table payout for %s must be positive", symbol)
		}
	}
	return nil
}

func (c Config) ValidBet(bet int64) bool {
	for _, option := range c.BetOptions {
		if option == bet {
			return true
		}
	}
	return false
}

func BuildBoard(reels [][]Symbol, rng *rand.Rand) (Board, error) {
	if len(reels) != 3 {
		return Board{}, ErrInvalidBoard
	}

	var board Board
	for col, reel := range reels {
		if len(reel) < 3 {
			return Board{}, ErrInvalidBoard
		}
		stop := rng.Intn(len(reel))
		for row := 0; row < 3; row++ {
			board[row][col] = reel[(stop+row)%len(reel)]
		}
	}
	return board, nil
}

func ValidateBoard(board Board) error {
	for row := 0; row < 3; row++ {
		for col := 0; col < 3; col++ {
			if board[row][col] == "" {
				return ErrInvalidBoard
			}
		}
	}
	return nil
}

func Evaluate(board Board, bet int64, payTable map[Symbol]int64) (SpinEvaluation, error) {
	if bet <= 0 {
		return SpinEvaluation{}, ErrInvalidBet
	}
	if err := ValidateBoard(board); err != nil {
		return SpinEvaluation{}, err
	}

	evaluation := SpinEvaluation{
		Board: board,
		Bet:   bet,
	}
	for row := 0; row < 3; row++ {
		symbol := board[row][0]
		if board[row][1] != symbol || board[row][2] != symbol {
			continue
		}
		multiplier := payTable[symbol]
		if multiplier <= 0 {
			continue
		}
		win := bet * multiplier
		evaluation.Win += win
		evaluation.Lines = append(evaluation.Lines, PaylineWin{
			Row:    row,
			Symbol: symbol,
			Count:  3,
			Win:    win,
		})
	}
	return evaluation, nil
}
