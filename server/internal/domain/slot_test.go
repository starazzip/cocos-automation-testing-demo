package domain

import "testing"

func TestEvaluateHorizontalPaylines(t *testing.T) {
	board := Board{
		{"A", "A", "A"},
		{"K", "Q", "K"},
		{"7", "7", "7"},
	}
	evaluation, err := Evaluate(board, 5, map[Symbol]int64{
		"A": 10,
		"7": 20,
	})
	if err != nil {
		t.Fatalf("Evaluate returned error: %v", err)
	}
	if evaluation.Win != 150 {
		t.Fatalf("expected win 150, got %d", evaluation.Win)
	}
	if len(evaluation.Lines) != 2 {
		t.Fatalf("expected 2 winning lines, got %d", len(evaluation.Lines))
	}
}

func TestEvaluateRejectsInvalidBoard(t *testing.T) {
	_, err := Evaluate(Board{}, 1, map[Symbol]int64{"A": 10})
	if err != ErrInvalidBoard {
		t.Fatalf("expected ErrInvalidBoard, got %v", err)
	}
}

func TestDefaultConfigValid(t *testing.T) {
	if err := DefaultConfig().Validate(); err != nil {
		t.Fatalf("default config should be valid: %v", err)
	}
}
