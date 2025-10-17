// Esta é a nossa função "serverless". Ela vai rodar no servidor da Vercel, não no navegador.
// O token da API ficará seguro aqui.

export default async function handler(request, response) {
    // Pegamos o token e o ID da loja das "Environment Variables", que são seguras.
    const API_TOKEN = process.env.CARDAPIO_API_TOKEN;
    const STORE_ID = process.env.CARDAPIO_STORE_ID;

    // Pegamos as datas que o nosso arquivo HTML enviou.
    const { startDate, endDate } = request.query;

    if (!startDate || !endDate) {
        return response.status(400).json({ error: 'As datas de início e fim são obrigatórias.' });
    }

    let allOrders = [];
    let page = 1;
    let hasMorePages = true;

    try {
        while (hasMorePages) {
            const apiUrl = `https://api.cardapioweb.com/api/v2/orders?status=delivered&created_at_gte=${startDate}&created_at_lte=${endDate}&page=${page}`;
            
            const apiResponse = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'X-API-TOKEN': API_TOKEN,
                    'X-STORE-ID': STORE_ID
                }
            });

            if (!apiResponse.ok) {
                // Se a API externa der erro, retornamos uma mensagem clara.
                throw new Error(`Erro na API do Cardapioweb: status ${apiResponse.status}`);
            }

            const result = await apiResponse.json();
            
            if (result.data && result.data.length > 0) {
                allOrders = allOrders.concat(result.data);
                hasMorePages = !!result.links.next;
                page++;
            } else {
                hasMorePages = false;
            }
        }
        
        // Se tudo deu certo, enviamos os dados de volta para a página HTML.
        return response.status(200).json(allOrders);

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Falha ao buscar os pedidos.' });
    }
}
