/**
 * Market Service
 * Provee datos financieros en tiempo real (Cripto, Divisas) para enriquecer el contexto de la IA.
 */

export const getMarketContext = async () => {
  try {
    // 1. Obtener Cripto (BTC, ETH en USD) - API Pública de CoinGecko
    const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    const cryptoData = await cryptoResponse.json();

    // 2. Obtener Tipo de Cambio (USD/MXN aproximado via API pública o estático si falla)
    // Nota: Usamos una API de libre acceso para el ejemplo.
    const forexResponse = await fetch('https://open.er-api.com/v6/latest/USD');
    const forexData = await forexResponse.json();

    const usdMxn = forexData?.rates?.MXN || 18.50; // Fallback razonable

    return {
      crypto: {
        bitcoin: cryptoData.bitcoin.usd,
        ethereum: cryptoData.ethereum.usd
      },
      forex: {
        usd_mxn: usdMxn
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching market context:', error);
    // Retornamos valores por defecto para no romper el flujo
    return {
      crypto: { bitcoin: 65000, ethereum: 3500 },
      forex: { usd_mxn: 18.00 },
      error: 'Data cached or estimated'
    };
  }
};
