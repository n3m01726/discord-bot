import { describe, it, expect, vi, beforeEach } from "vitest";
import nowplayingCommand from "../../bot/commands/radio/nowplaying.js";
import { MessageFlags } from "#discord";
import axios from "axios";

vi.mock("axios");

// Mock interaction
let mockInteraction;

beforeEach(() => {
  mockInteraction = {
    reply: vi.fn().mockResolvedValue(true),
  };
});

describe("NowPlaying Command", () => {
  it("affiche la chanson en cours si l’API répond correctement", async () => {
    axios.get.mockResolvedValueOnce({
      data: { icestats: { source: { title: "Test Song - Artist" } } },
    });
    await nowplayingCommand.execute(mockInteraction);
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      "🎶 Now playing: **Test Song - Artist**"
    );
  });

  it('affiche "Aucune chanson en cours." si l’API ne retourne pas de titre', async () => {
    axios.get.mockResolvedValueOnce({ data: { icestats: { source: {} } } });
    await nowplayingCommand.execute(mockInteraction);
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      "🎶 Now playing: **Aucune chanson en cours.**"
    );
  });

  it("affiche un message d’erreur si l’API est indisponible", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));
    await nowplayingCommand.execute(mockInteraction);
    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: "❌ Impossible de récupérer la chanson actuelle.",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("gère un format de réponse inattendu", async () => {
    axios.get.mockResolvedValueOnce({ data: null });
    await nowplayingCommand.execute(mockInteraction);
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      "🎶 Now playing: **Aucune chanson en cours.**"
    );
  });
});
