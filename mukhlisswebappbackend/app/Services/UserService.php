<?php
namespace App\Services;
use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;

class UserService {
    protected $userRepository;

    public function __construct(UserRepositoryInterface $userRepository) {
        $this->userRepository = $userRepository;
    }

    public function getAllUsers(): array {
        return $this->userRepository->getAllUsers();
    }
}



?>