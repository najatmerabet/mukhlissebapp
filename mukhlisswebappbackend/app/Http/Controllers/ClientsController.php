<?php
namespace App\Http\Controllers;
use App\Services\ClientService;
use Illuminate\Http\Request;

class ClientsController extends Controller {
    protected $clientService;

    public function __construct(ClientService $clientService) {
        $this->clientService = $clientService;
    }

    public function index() {
        $clients = $this->clientService->getAllClients();
        return response()->json($clients);
    }
}

?>