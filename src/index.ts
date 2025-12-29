import { serve } from "bun";
import index from "./index.html";
import { ztvManager } from "./lib/ztv-process";
import { persistence } from "./lib/persistence";
import type {
  ApiResponse,
  Channel,
  Tunnel,
  InputStream,
  OutputStream,
  ChannelCreateParams,
  TunnelCreateParams,
  SavedConfiguration,
  ZtvStatus,
  Statistics,
  DeltaStatistics,
  SdiDevice,
  LogLevel,
} from "./lib/types";

// Helper to create JSON responses
function json<T>(data: ApiResponse<T>, status = 200): Response {
  return Response.json(data, { status });
}

function success<T>(data: T): Response {
  return json({ success: true, data });
}

function error(message: string, status = 400): Response {
  return json({ success: false, error: message }, status);
}

// Parse request body with error handling
async function parseBody<T>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw new Error("Invalid JSON body");
  }
}

const server = serve({
  hostname: "0.0.0.0",
  port: parseInt(process.env.PORT || "3000"),
  routes: {
    // ============================================
    // ZTV Process Control
    // ============================================

    "/api/ztv/start": {
      async POST(req) {
        try {
          const body = await parseBody<{ ztvPath?: string }>(req).catch(() => ({ ztvPath: undefined }));
          const ztvPath = body.ztvPath || persistence.getDefaultZtvPath();
          await ztvManager.start(ztvPath);
          return success({ message: "ZTV started", pid: ztvManager.getPid() });
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    "/api/ztv/stop": {
      async POST() {
        try {
          await ztvManager.stop();
          return success({ message: "ZTV stopped" });
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    "/api/ztv/restart": {
      async POST() {
        try {
          await ztvManager.restart();
          return success({ message: "ZTV restarted", pid: ztvManager.getPid() });
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    "/api/ztv/status": {
      GET() {
        const status: ZtvStatus = {
          running: ztvManager.isRunning(),
          pid: ztvManager.getPid(),
          startedAt: ztvManager.getStartedAt()?.toISOString(),
        };
        return success(status);
      },
    },

    // ============================================
    // Channels
    // ============================================

    "/api/channels": {
      GET() {
        const channels = ztvManager.getChannels();
        return success(channels);
      },

      async POST(req) {
        try {
          const params = await parseBody<ChannelCreateParams>(req);
          if (!params.channelId || !params.description) {
            return error("channelId and description are required");
          }
          await ztvManager.addChannel(params);
          return success(ztvManager.getChannel(params.channelId));
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    "/api/channels/:channelId": {
      GET(req) {
        const channelId = parseInt(req.params.channelId);
        const channel = ztvManager.getChannel(channelId);
        if (!channel) {
          return error("Channel not found", 404);
        }
        return success(channel);
      },

      async DELETE(req) {
        try {
          const channelId = parseInt(req.params.channelId);
          await ztvManager.removeChannel(channelId);
          return success({ message: "Channel removed" });
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    // ============================================
    // Input Streams
    // ============================================

    "/api/channels/:channelId/inputs": {
      GET(req) {
        const channelId = parseInt(req.params.channelId);
        const channel = ztvManager.getChannel(channelId);
        if (!channel) {
          return error("Channel not found", 404);
        }
        return success(channel.inputs);
      },

      async POST(req) {
        try {
          const channelId = parseInt(req.params.channelId);
          const input = await parseBody<InputStream>(req);
          await ztvManager.addInput(channelId, input);
          return success(input);
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    // ============================================
    // Output Streams
    // ============================================

    "/api/channels/:channelId/outputs": {
      GET(req) {
        const channelId = parseInt(req.params.channelId);
        const channel = ztvManager.getChannel(channelId);
        if (!channel) {
          return error("Channel not found", 404);
        }
        return success(channel.outputs);
      },

      async POST(req) {
        try {
          const channelId = parseInt(req.params.channelId);
          const output = await parseBody<OutputStream>(req);
          await ztvManager.addOutput(channelId, output);
          return success(output);
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    "/api/channels/:channelId/outputs/:streamId": {
      async DELETE(req) {
        try {
          const channelId = parseInt(req.params.channelId);
          const streamId = parseInt(req.params.streamId);
          await ztvManager.removeOutput(channelId, streamId);
          return success({ message: "Output removed" });
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    "/api/channels/:channelId/inputs/:streamId": {
      async DELETE(req) {
        try {
          const channelId = parseInt(req.params.channelId);
          const streamId = parseInt(req.params.streamId);
          await ztvManager.removeInput(channelId, streamId);
          return success({ message: "Input removed" });
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    // ============================================
    // Tunnels
    // ============================================

    "/api/tunnels": {
      GET() {
        const tunnels = ztvManager.getTunnels();
        return success(tunnels);
      },

      async POST(req) {
        try {
          const params = await parseBody<TunnelCreateParams>(req);
          await ztvManager.addTunnel(params);
          return success(ztvManager.getTunnel(params.tunnelId));
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    "/api/tunnels/:tunnelId": {
      GET(req) {
        const tunnelId = parseInt(req.params.tunnelId);
        const tunnel = ztvManager.getTunnel(tunnelId);
        if (!tunnel) {
          return error("Tunnel not found", 404);
        }
        return success(tunnel);
      },

      async DELETE(req) {
        try {
          const tunnelId = parseInt(req.params.tunnelId);
          await ztvManager.removeTunnel(tunnelId);
          return success({ message: "Tunnel removed" });
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    // ============================================
    // Monitoring
    // ============================================

    "/api/monitoring/statistics": {
      async GET() {
        try {
          const stats = await ztvManager.getStatistics();
          return success(stats);
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    "/api/monitoring/delta": {
      async GET() {
        try {
          const delta = await ztvManager.getDeltaStatistics();
          return success(delta);
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    "/api/monitoring/sdi-devices": {
      async GET() {
        try {
          const devices = await ztvManager.listSdiDevices();
          return success(devices);
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    // ============================================
    // Configuration Persistence
    // ============================================

    "/api/config": {
      GET() {
        const configs = persistence.listConfigurations();
        return success(configs);
      },

      async POST(req) {
        try {
          const body = await parseBody<{ name: string; description?: string }>(req);
          if (!body.name) {
            return error("name is required");
          }

          const state = ztvManager.exportState();
          const config = persistence.saveConfiguration({
            name: body.name,
            description: body.description,
            ...state,
          });

          return success(config);
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    "/api/config/:configId": {
      GET(req) {
        const configId = req.params.configId;
        const config = persistence.getConfiguration(configId);
        if (!config) {
          return error("Configuration not found", 404);
        }
        return success(config);
      },

      async DELETE(req) {
        const configId = req.params.configId;
        const deleted = persistence.deleteConfiguration(configId);
        if (!deleted) {
          return error("Configuration not found", 404);
        }
        return success({ message: "Configuration deleted" });
      },
    },

    "/api/config/:configId/load": {
      async POST(req) {
        try {
          const configId = req.params.configId;
          const config = persistence.getConfiguration(configId);
          if (!config) {
            return error("Configuration not found", 404);
          }

          // Clear current state and load new configuration
          await ztvManager.clearState();
          await ztvManager.importState({
            channels: config.channels,
            tunnels: config.tunnels,
            loggingLevel: config.loggingLevel,
          });

          persistence.setLastLoadedConfigId(configId);
          return success({ message: "Configuration loaded", config });
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    // ============================================
    // Logging
    // ============================================

    "/api/logging": {
      GET() {
        return success({ level: ztvManager.getLoggingLevel() });
      },

      async PUT(req) {
        try {
          const body = await parseBody<{ level: LogLevel }>(req);
          if (!body.level) {
            return error("level is required");
          }
          await ztvManager.setLoggingLevel(body.level);
          return success({ level: body.level });
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    // ============================================
    // Settings
    // ============================================

    "/api/settings/ztv-path": {
      GET() {
        return success({ path: persistence.getDefaultZtvPath() });
      },

      async PUT(req) {
        try {
          const body = await parseBody<{ path: string }>(req);
          if (!body.path) {
            return error("path is required");
          }
          persistence.setDefaultZtvPath(body.path);
          return success({ path: body.path });
        } catch (err) {
          return error(String(err), 500);
        }
      },
    },

    // ============================================
    // Frontend (catch-all)
    // ============================================

    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`ZTV Controller running at ${server.url}`);
