package domain

import "errors"

var (
	ErrInvalidAmount       = errors.New("invalid amount")
	ErrInvalidBet          = errors.New("invalid bet")
	ErrInvalidBoard        = errors.New("invalid board")
	ErrInsufficientBalance = errors.New("insufficient balance")
)
