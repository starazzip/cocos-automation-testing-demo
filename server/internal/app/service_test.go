package app

import (
	"context"
	"errors"
	"path/filepath"
	"sync"
	"testing"

	"github.com/starazzip/cocos-automation-testing-demo/server/internal/domain"
	"github.com/starazzip/cocos-automation-testing-demo/server/internal/store/sqlite"
)

func newTestService(t *testing.T) (*Service, domain.Config, func()) {
	t.Helper()

	store, err := sqlite.Open(filepath.Join(t.TempDir(), "slot.db"))
	if err != nil {
		t.Fatalf("open sqlite store: %v", err)
	}
	service := NewService(store)
	config := domain.DefaultConfig()
	if err := service.Init(context.Background(), config); err != nil {
		t.Fatalf("init service: %v", err)
	}
	return service, config, func() {
		_ = store.Close()
	}
}

func TestInitSeedsDefaults(t *testing.T) {
	service, config, cleanup := newTestService(t)
	defer cleanup()

	loaded, err := service.Config(context.Background())
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if loaded.LocalPlayer != config.LocalPlayer {
		t.Fatalf("expected local player %q, got %q", config.LocalPlayer, loaded.LocalPlayer)
	}
	balance, err := service.Balance(context.Background(), config.LocalPlayer)
	if err != nil {
		t.Fatalf("load balance: %v", err)
	}
	if balance != 0 {
		t.Fatalf("expected seeded balance 0, got %d", balance)
	}
}

func TestCreditInAndCreditOutPersist(t *testing.T) {
	service, config, cleanup := newTestService(t)
	defer cleanup()

	balance, err := service.CreditIn(context.Background(), config.LocalPlayer, 100)
	if err != nil {
		t.Fatalf("credit in: %v", err)
	}
	if balance != 100 {
		t.Fatalf("expected balance 100, got %d", balance)
	}
	paidOut, balance, err := service.CreditOut(context.Background(), config.LocalPlayer)
	if err != nil {
		t.Fatalf("credit out: %v", err)
	}
	if paidOut != 100 || balance != 0 {
		t.Fatalf("expected paidOut 100 and balance 0, got paidOut %d balance %d", paidOut, balance)
	}
}

func TestSpinRejectsInsufficientBalance(t *testing.T) {
	service, config, cleanup := newTestService(t)
	defer cleanup()

	_, err := service.Spin(context.Background(), config.LocalPlayer, 1)
	if !errors.Is(err, domain.ErrInsufficientBalance) {
		t.Fatalf("expected insufficient balance, got %v", err)
	}
}

func TestForcedBoardAppliesOnceAndUsesNormalPayout(t *testing.T) {
	service, config, cleanup := newTestService(t)
	defer cleanup()

	if _, err := service.CreditIn(context.Background(), config.LocalPlayer, 100); err != nil {
		t.Fatalf("credit in: %v", err)
	}

	forced := domain.Board{
		{"A", "A", "A"},
		{"K", "Q", "K"},
		{"7", "7", "7"},
	}
	if err := service.ForceNextBoard(forced); err != nil {
		t.Fatalf("force board: %v", err)
	}
	result, err := service.Spin(context.Background(), config.LocalPlayer, 1)
	if err != nil {
		t.Fatalf("spin: %v", err)
	}
	if result.Board != forced {
		t.Fatalf("expected forced board %#v, got %#v", forced, result.Board)
	}
	if result.Win != 30 {
		t.Fatalf("expected win 30, got %d", result.Win)
	}
	if result.Balance != 129 {
		t.Fatalf("expected balance 129, got %d", result.Balance)
	}
	if service.forcedBoard != nil {
		t.Fatalf("expected forced board to be consumed after one spin")
	}
}

func TestConcurrentSpinDoesNotRace(t *testing.T) {
	service, config, cleanup := newTestService(t)
	defer cleanup()

	if _, err := service.CreditIn(context.Background(), config.LocalPlayer, 1000); err != nil {
		t.Fatalf("credit in: %v", err)
	}

	const spins = 20
	var wg sync.WaitGroup
	errs := make(chan error, spins)
	for i := 0; i < spins; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := service.Spin(context.Background(), config.LocalPlayer, 1)
			errs <- err
		}()
	}
	wg.Wait()
	close(errs)

	for err := range errs {
		if err != nil {
			t.Fatalf("spin: %v", err)
		}
	}
}
