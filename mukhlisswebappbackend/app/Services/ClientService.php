<?php

namespace App\Services ;

use App\Repositories\Interfaces\ClientRepositoryInterface;
use App\Models\Client;
class ClientService {
    protected $clientRepository;

    public function __construct(ClientRepositoryInterface $clientRepository) {
        $this->clientRepository = $clientRepository;
    }

    public function getAllClients() {
        return $this->clientRepository->all();
    }
}

?>