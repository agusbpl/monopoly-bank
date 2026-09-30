import { useState, useEffect, useRef } from 'react';
import type { Game, Player } from './types/game';
import { GameService } from './services/gameService';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { GameDashboard } from './components/GameDashboard';
import { QRScannerModal } from './components/QRScannerModal';
import { QRGeneratorModal } from './components/QRGeneratorModal';
import { BankModal } from './components/BankModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { SupabaseGuideModal } from './components/SupabaseGuideModal';
import { playCoinsSound, triggerHaptic } from './utils/sound';

const SESSION_KEY = 'monopoly_active_session';

export function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialRecipient, setScannerInitialRecipient] = useState<string | undefined>(undefined);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Keep ref to previous balance for sound detection on receiving money
  const prevBalanceRef = useRef<number | null>(null);

  // 1. Recover active session from localStorage on mount
  useEffect(() => {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (rawSession) {
      try {
        const { gameId, playerId } = JSON.parse(rawSession);
        GameService.getGame(gameId).then((loadedGame) => {
          if (loadedGame && loadedGame.players[playerId]) {
            setGame(loadedGame);
            setCurrentPlayer(loadedGame.players[playerId]);
            prevBalanceRef.current = loadedGame.players[playerId].balance;
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        });
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // 2. Subscribe to real-time game updates
  useEffect(() => {
    if (!game?.id || !currentPlayer?.id) return;

    const unsubscribe = GameService.subscribeToGame(game.id, (updatedGame) => {
      setGame(updatedGame);
      const myUpdatedProfile = updatedGame.players[currentPlayer.id];
      if (myUpdatedProfile) {
        // If balance increased, notify player with chime sound
        if (
          prevBalanceRef.current !== null &&
          myUpdatedProfile.balance > prevBalanceRef.current
        ) {
          playCoinsSound();
          triggerHaptic('success');
        }
        prevBalanceRef.current = myUpdatedProfile.balance;
        setCurrentPlayer(myUpdatedProfile);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [game?.id, currentPlayer?.id]);

  // Handlers
  const handleGameJoined = (newGame: Game, player: Player) => {
    setGame(newGame);
    setCurrentPlayer(player);
    prevBalanceRef.current = player.balance;
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ gameId: newGame.id, playerId: player.id })
    );
  };

  const handleLeaveGame = () => {
    if (window.confirm('¿Seguro que querés salir de la partida?')) {
      localStorage.removeItem(SESSION_KEY);
      setGame(null);
      setCurrentPlayer(null);
    }
  };

  const handleTransfer = async (toId: string, amount: number, reason?: string) => {
    if (!game || !currentPlayer) return;
    const updated = await GameService.transfer(
      game.id,
      currentPlayer.id,
      toId,
      amount,
      reason
    );
    setGame(updated);
    if (updated.players[currentPlayer.id]) {
      setCurrentPlayer(updated.players[currentPlayer.id]);
    }
  };

  const handleBankTransfer = async (
    fromId: string,
    toId: string,
    amount: number,
    reason?: string
  ) => {
    if (!game || !currentPlayer) return;
    const updated = await GameService.transfer(game.id, fromId, toId, amount, reason);
    setGame(updated);
    if (updated.players[currentPlayer.id]) {
      setCurrentPlayer(updated.players[currentPlayer.id]);
    }
  };

  const handlePassGo = async () => {
    if (!game || !currentPlayer) return;
    const updated = await GameService.passGo(game.id, currentPlayer.id);
    setGame(updated);
    if (updated.players[currentPlayer.id]) {
      setCurrentPlayer(updated.players[currentPlayer.id]);
    }
  };

  const handleDirectTransferToPlayer = (targetPlayerId: string) => {
    setScannerInitialRecipient(targetPlayerId);
    setIsScannerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* View routing: Lobby vs Game Dashboard */}
      {!game || !currentPlayer ? (
        <Lobby onGameJoined={handleGameJoined} onOpenGuide={() => setIsGuideOpen(true)} />
      ) : (
        <>
          <Navbar
            game={game}
            currentPlayer={currentPlayer}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenBank={() => setIsBankOpen(true)}
            onOpenGuide={() => setIsGuideOpen(true)}
            onLeaveGame={handleLeaveGame}
          />

          <main className="flex-1">
            <GameDashboard
              game={game}
              currentPlayer={currentPlayer}
              onOpenScanner={() => {
                setScannerInitialRecipient(undefined);
                setIsScannerOpen(true);
              }}
              onOpenGenerator={() => setIsGeneratorOpen(true)}
              onOpenBank={() => setIsBankOpen(true)}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onPassGo={handlePassGo}
              onDirectTransferToPlayer={handleDirectTransferToPlayer}
            />
          </main>

          {/* Modals */}
          <QRScannerModal
            isOpen={isScannerOpen}
            onClose={() => {
              setIsScannerOpen(false);
              setScannerInitialRecipient(undefined);
            }}
            game={game}
            currentPlayer={currentPlayer}
            initialRecipientId={scannerInitialRecipient}
            onTransfer={handleTransfer}
          />

          <QRGeneratorModal
            isOpen={isGeneratorOpen}
            onClose={() => setIsGeneratorOpen(false)}
            game={game}
            currentPlayer={currentPlayer}
          />

          <BankModal
            isOpen={isBankOpen}
            onClose={() => setIsBankOpen(false)}
            currentPlayer={currentPlayer}
            onTransfer={handleBankTransfer}
          />

          <TransactionHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            game={game}
            currentPlayer={currentPlayer}
          />
        </>
      )}

      {/* Guide Modal (accessible from Lobby and Navbar) */}
      <SupabaseGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}

export default App;
