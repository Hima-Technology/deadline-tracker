<?php
namespace App\Core;

class Router
{
    private array $routes = [];

    public function add(string $method, string $path, $handler): void
    {
        $this->routes[] = compact('method', 'path', 'handler');
    }

    public function get(string $p, $h)    { $this->add('GET',    $p, $h); }
    public function post(string $p, $h)   { $this->add('POST',   $p, $h); }
    public function put(string $p, $h)    { $this->add('PUT',    $p, $h); }
    public function delete(string $p, $h) { $this->add('DELETE', $p, $h); }

    public function dispatch(string $method, string $uri): void
    {
        // Kama ni POST lakini kuna _method=PUT kwenye FormData, tumia PUT
        if ($method === 'POST' && isset($_POST['_method'])) {
            $method = strtoupper($_POST['_method']);
        }

        foreach ($this->routes as $r) {
            if ($r['method'] !== $method) continue;
            
            // Badilisha {id} kuwa (\d+) na {path} kuwa (.*)
            $pattern = preg_replace('#\{id\}#', '(\d+)', $r['path']);
            $pattern = preg_replace('#\{path\}#', '(.*)', $pattern);
            $pattern = '#^' . $pattern . '$#';

            if (preg_match($pattern, $uri, $matches)) {
                array_shift($matches);
                
                if (is_array($r['handler']) && count($r['handler']) === 2) {
                    $controller = new $r['handler'][0]();
                    $action = $r['handler'][1];
                    call_user_func_array([$controller, $action], $matches);
                } else {
                    call_user_func_array($r['handler'], $matches);
                }
                return;
            }
        }
        Response::error('Route not found', 404);
    }
}