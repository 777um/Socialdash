import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp-up para 100 usuários
    { duration: '5m', target: 100 },  // Manter 100 usuários
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  group('Home Page', () => {
    const res = http.get('http://localhost:3000/');
    check(res, {
      'status is 200': (r) => r.status === 200,
      'load time < 500ms': (r) => r.timings.duration < 500,
      'has title': (r) => r.body.includes('Social Media AI Automation'),
    });
  });

  sleep(1);

  group('Dashboard', () => {
    const res = http.get('http://localhost:3000/dashboard');
    check(res, {
      'status is 200': (r) => r.status === 200,
      'load time < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(1);

  group('Notifications API', () => {
    // Listar notificações
    const listRes = http.get('http://localhost:3000/api/trpc/notifications.listNotifications?input={}');
    check(listRes, {
      'list status is 200': (r) => r.status === 200,
      'list response time < 300ms': (r) => r.timings.duration < 300,
    });
  });

  sleep(1);

  group('Dashboard Metrics', () => {
    const res = http.get('http://localhost:3000/dashboard');
    check(res, {
      'metrics loaded': (r) => r.body.includes('Dashboard de Métricas'),
      'performance data present': (r) => r.body.includes('Performance'),
    });
  });

  sleep(1);
}
