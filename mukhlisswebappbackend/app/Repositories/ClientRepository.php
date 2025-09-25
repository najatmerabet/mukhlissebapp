<?php
namespace App\Repositories;
use App\Repositories\Interfaces\ClientRepositoryInterface;
use App\Models\Client;
class ClientRepository implements ClientRepositoryInterface {
    public function all() {
        return Client::all();
    }
}
