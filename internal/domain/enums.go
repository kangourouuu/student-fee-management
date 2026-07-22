package domain

import "fmt"

// StudentStatus represents academic student statuses.
type StudentStatus string

const (
	StatusEnrolled  StudentStatus = "enrolled"
	StatusInactive  StudentStatus = "inactive"
	StatusGraduated StudentStatus = "graduated"
	StatusSuspended StudentStatus = "suspended"
)

func (s StudentStatus) IsValid() bool {
	switch s {
	case StatusEnrolled, StatusInactive, StatusGraduated, StatusSuspended:
		return true
	default:
		return false
	}
}

func ParseStudentStatus(str string) (StudentStatus, error) {
	status := StudentStatus(str)
	if !status.IsValid() {
		return "", fmt.Errorf("invalid student status: %s", str)
	}
	return status, nil
}
