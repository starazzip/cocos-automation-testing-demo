package app

import (
	"context"
	"math/rand"
	"sync"
	"time"

	"github.com/starazzip/cocos-automation-testing-demo/server/internal/domain"
)

type Repository interface {
	EnsureDefaults(ctx context.Context, config domain.Config) error
	Config(ctx context.Context) (domain.Config, error)
	Balance(ctx context.Context, playerID string) (int64, error)
	CreditIn(ctx context.Context, playerID string, amount int64) (int64, error)
	CreditOut(ctx context.Context, playerID string) (paidOut int64, balance int64, err error)
	ApplySpin(ctx context.Context, playerID string, evaluation domain.SpinEvaluation) (balance int64, spinID int64, err error)
}

type Service struct {
	repo Repository
	rng  *rand.Rand

	mu          sync.Mutex
	forcedBoard *domain.Board
}

type SpinResult struct {
	SpinID  int64
	Board   domain.Board
	Bet     int64
	Win     int64
	Lines   []domain.PaylineWin
	Balance int64
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
		rng:  rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

func (s *Service) Init(ctx context.Context, config domain.Config) error {
	if err := config.Validate(); err != nil {
		return err
	}
	return s.repo.EnsureDefaults(ctx, config)
}

func (s *Service) Config(ctx context.Context) (domain.Config, error) {
	return s.repo.Config(ctx)
}

func (s *Service) Balance(ctx context.Context, playerID string) (int64, error) {
	return s.repo.Balance(ctx, playerID)
}

func (s *Service) CreditIn(ctx context.Context, playerID string, amount int64) (int64, error) {
	if amount <= 0 {
		return 0, domain.ErrInvalidAmount
	}
	return s.repo.CreditIn(ctx, playerID, amount)
}

func (s *Service) CreditOut(ctx context.Context, playerID string) (int64, int64, error) {
	return s.repo.CreditOut(ctx, playerID)
}

func (s *Service) ForceNextBoard(board domain.Board) error {
	if err := domain.ValidateBoard(board); err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	copied := board
	s.forcedBoard = &copied
	return nil
}

func (s *Service) Spin(ctx context.Context, playerID string, bet int64) (SpinResult, error) {
	config, err := s.repo.Config(ctx)
	if err != nil {
		return SpinResult{}, err
	}
	if !config.ValidBet(bet) {
		return SpinResult{}, domain.ErrInvalidBet
	}

	balance, err := s.repo.Balance(ctx, playerID)
	if err != nil {
		return SpinResult{}, err
	}
	if balance < bet {
		return SpinResult{}, domain.ErrInsufficientBalance
	}

	board, err := s.nextBoard(config)
	if err != nil {
		return SpinResult{}, err
	}
	evaluation, err := domain.Evaluate(board, bet, config.PayTable)
	if err != nil {
		return SpinResult{}, err
	}

	newBalance, spinID, err := s.repo.ApplySpin(ctx, playerID, evaluation)
	if err != nil {
		return SpinResult{}, err
	}
	return SpinResult{
		SpinID:  spinID,
		Board:   evaluation.Board,
		Bet:     evaluation.Bet,
		Win:     evaluation.Win,
		Lines:   evaluation.Lines,
		Balance: newBalance,
	}, nil
}

func (s *Service) nextBoard(config domain.Config) (domain.Board, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	forced := s.forcedBoard
	if forced != nil {
		board := *forced
		s.forcedBoard = nil
		return board, nil
	}

	return domain.BuildBoard(config.Reels, s.rng)
}
