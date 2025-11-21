import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, Pause, RefreshCw, SkipForward, XCircle } from 'lucide-react';

export const FlowActionsMenu = ({ lead, activeFlowInstance, flowActions, children }) => {
  const isRunning = activeFlowInstance?.status === 'running';
  const isPaused = activeFlowInstance?.status === 'paused';
  const hasActiveFlow = isRunning || isPaused;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white">
        <DropdownMenuLabel>Ações do Fluxo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {!hasActiveFlow && (
          <DropdownMenuItem onSelect={() => flowActions('start', lead)}>
            <Play className="mr-2 h-4 w-4 text-green-500" />
            <span>Iniciar Fluxo</span>
          </DropdownMenuItem>
        )}

        {isRunning && (
          <DropdownMenuItem onSelect={() => flowActions('pause', lead)}>
            <Pause className="mr-2 h-4 w-4 text-yellow-500" />
            <span>Pausar Fluxo</span>
          </DropdownMenuItem>
        )}

        {isPaused && (
          <DropdownMenuItem onSelect={() => flowActions('resume', lead)}>
            <Play className="mr-2 h-4 w-4 text-green-500" />
            <span>Retomar Fluxo</span>
          </DropdownMenuItem>
        )}

        {hasActiveFlow && (
          <>
            <DropdownMenuItem onSelect={() => flowActions('change', lead)}>
              <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
              <span>Trocar Fluxo</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => flowActions('reset', lead)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <XCircle className="mr-2 h-4 w-4" />
              <span>Resetar Fluxo</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};