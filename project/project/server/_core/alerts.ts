/**
 * SISTEMA DE ALERTAS TÉCNICOS
 * Monitora saúde do sistema e envia alertas em tempo real
 * Integrado com notificações e logging
 */

import { notifyOwner } from './notification';

export interface Alert {
  id: string;
  tipo: 'erro' | 'aviso' | 'info' | 'crítico';
  titulo: string;
  mensagem: string;
  timestamp: Date;
  dados?: Record<string, any>;
  resolvido?: boolean;
}

class AlertSystem {
  private alertas: Map<string, Alert> = new Map();
  private limites = {
    errorRate: 0.1, // 10% de taxa de erro
    responseTime: 5000, // 5 segundos
    memoryUsage: 0.85, // 85% de uso de memória
    databaseConnections: 90, // 90% de conexões
  };

  /**
   * Registrar alerta
   */
  registrarAlerta(alerta: Omit<Alert, 'id' | 'timestamp'>) {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const novoAlerta: Alert = {
      ...alerta,
      id,
      timestamp: new Date(),
    };

    this.alertas.set(id, novoAlerta);

    // Notificar owner se for crítico
    if (alerta.tipo === 'crítico') {
      this.notificarOwner(novoAlerta);
    }

    console.log(`[ALERTA] ${alerta.tipo.toUpperCase()}: ${alerta.titulo}`);
    return id;
  }

  /**
   * Monitorar taxa de erro
   */
  monitorarTaxaErro(totalRequisicoes: number, erros: number) {
    const taxaErro = erros / totalRequisicoes;

    if (taxaErro > this.limites.errorRate) {
      this.registrarAlerta({
        tipo: 'crítico',
        titulo: 'Taxa de Erro Elevada',
        mensagem: `Taxa de erro: ${(taxaErro * 100).toFixed(2)}% (limite: ${(this.limites.errorRate * 100).toFixed(2)}%)`,
        dados: { taxaErro, totalRequisicoes, erros },
      });
    }
  }

  /**
   * Monitorar tempo de resposta
   */
  monitorarTempoResposta(tempo: number, endpoint: string) {
    if (tempo > this.limites.responseTime) {
      this.registrarAlerta({
        tipo: 'aviso',
        titulo: 'Tempo de Resposta Lento',
        mensagem: `Endpoint ${endpoint} levou ${tempo}ms (limite: ${this.limites.responseTime}ms)`,
        dados: { tempo, endpoint },
      });
    }
  }

  /**
   * Monitorar uso de memória
   */
  monitorarMemoria() {
    const uso = process.memoryUsage();
    const percentualUso = uso.heapUsed / uso.heapTotal;

    if (percentualUso > this.limites.memoryUsage) {
      this.registrarAlerta({
        tipo: 'aviso',
        titulo: 'Uso de Memória Elevado',
        mensagem: `Uso: ${(percentualUso * 100).toFixed(2)}% (${Math.round(uso.heapUsed / 1024 / 1024)}MB)`,
        dados: { percentualUso, heapUsed: uso.heapUsed, heapTotal: uso.heapTotal },
      });
    }
  }

  /**
   * Monitorar conexões com banco de dados
   */
  monitorarConexoesBD(ativas: number, maximas: number) {
    const percentual = (ativas / maximas) * 100;

    if (percentual > this.limites.databaseConnections) {
      this.registrarAlerta({
        tipo: 'aviso',
        titulo: 'Conexões de BD Elevadas',
        mensagem: `${ativas}/${maximas} conexões ativas (${percentual.toFixed(2)}%)`,
        dados: { ativas, maximas, percentual },
      });
    }
  }

  /**
   * Registrar erro de script
   */
  registrarErroScript(scriptType: string, erro: string, userId?: number) {
    this.registrarAlerta({
      tipo: 'erro',
      titulo: `Erro no Script: ${scriptType}`,
      mensagem: erro.slice(0, 200),
      dados: { scriptType, userId, erro: erro.slice(0, 500) },
    });
  }

  /**
   * Registrar falha de autenticação
   */
  registrarFalhaAutenticacao(tentativas: number, ip: string) {
    if (tentativas > 5) {
      this.registrarAlerta({
        tipo: 'crítico',
        titulo: 'Múltiplas Tentativas de Autenticação',
        mensagem: `${tentativas} tentativas falhas do IP ${ip}`,
        dados: { tentativas, ip },
      });
    }
  }

  /**
   * Registrar acesso não autorizado
   */
  registrarAcessoNaoAutorizado(userId: number, recurso: string) {
    this.registrarAlerta({
      tipo: 'aviso',
      titulo: 'Tentativa de Acesso Não Autorizado',
      mensagem: `Usuário ${userId} tentou acessar ${recurso}`,
      dados: { userId, recurso },
    });
  }

  /**
   * Notificar owner
   */
  private async notificarOwner(alerta: Alert) {
    try {
      await notifyOwner({
        title: `🚨 ALERTA CRÍTICO: ${alerta.titulo}`,
        content: `${alerta.mensagem}\n\nTempo: ${alerta.timestamp.toLocaleString('pt-BR')}\n\nDados: ${JSON.stringify(alerta.dados, null, 2)}`,
      });
    } catch (erro) {
      console.error('[ALERTA] Falha ao notificar owner:', erro);
    }
  }

  /**
   * Obter alertas recentes
   */
  obterAlertas(filtro?: { tipo?: Alert['tipo']; resolvido?: boolean; horas?: number }) {
    let alertas = Array.from(this.alertas.values());

    if (filtro?.tipo) {
      alertas = alertas.filter(a => a.tipo === filtro.tipo);
    }

    if (filtro?.resolvido !== undefined) {
      alertas = alertas.filter(a => a.resolvido === filtro.resolvido);
    }

    if (filtro?.horas) {
      const agora = new Date();
      const limite = new Date(agora.getTime() - filtro.horas * 3600000);
      alertas = alertas.filter(a => a.timestamp > limite);
    }

    return alertas.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Resolver alerta
   */
  resolverAlerta(id: string) {
    const alerta = this.alertas.get(id);
    if (alerta) {
      alerta.resolvido = true;
    }
  }

  /**
   * Limpar alertas resolvidos
   */
  limparAlertas(horas: number = 24) {
    const limite = new Date(Date.now() - horas * 3600000);
    const idsParaDeletar: string[] = [];
    this.alertas.forEach((alerta, id) => {
      if (alerta.resolvido && alerta.timestamp < limite) {
        idsParaDeletar.push(id);
      }
    });
    idsParaDeletar.forEach(id => this.alertas.delete(id));
  }

  /**
   * Obter estatísticas de alertas
   */
  obterEstatisticas() {
    const alertas = Array.from(this.alertas.values());
    return {
      total: alertas.length,
      criticos: alertas.filter(a => a.tipo === 'crítico').length,
      avisos: alertas.filter(a => a.tipo === 'aviso').length,
      erros: alertas.filter(a => a.tipo === 'erro').length,
      resolvidos: alertas.filter(a => a.resolvido).length,
      naoResolvidos: alertas.filter(a => !a.resolvido).length,
    };
  }
}

export const alertSystem = new AlertSystem();

/**
 * Middleware para monitorar requisições
 */
export function alertasMiddleware() {
  return (req: any, res: any, next: any) => {
    const inicio = Date.now();

    res.on('finish', () => {
      const tempo = Date.now() - inicio;
      const statusCode = res.statusCode;

      // Monitorar tempo de resposta
      alertSystem.monitorarTempoResposta(tempo, req.path);

      // Monitorar erros HTTP
      if (statusCode >= 500) {
        alertSystem.registrarAlerta({
          tipo: 'erro',
          titulo: `Erro HTTP ${statusCode}`,
          mensagem: `${req.method} ${req.path} retornou ${statusCode}`,
          dados: { statusCode, metodo: req.method, caminho: req.path, tempo },
        });
      }

      // Monitorar memória periodicamente
      if (Math.random() < 0.1) {
        alertSystem.monitorarMemoria();
      }
    });

    next();
  };
}
