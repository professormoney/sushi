const HUPAY_BASE = 'https://hupay.pro/api/v1';

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ success:false, message:'Method not allowed' }) };
  }

  try {
    const { amount, description } = JSON.parse(event.body || '{}');
    const value = Number(amount);
    if (!value || value < 1) {
      return { statusCode: 422, headers: cors, body: JSON.stringify({ success:false, message:'Valor inválido' }) };
    }

    const body = {
      amount: value,
      currency: 'BRL',
      description: String(description || `PIX R$ ${value.toFixed(2)}`),
      name: 'Pedido Site',
      email: 'pedido@example.com',
      document: '00011122299',
      phone: '11999999999'
    };

    const hupay = await fetch(`${HUPAY_BASE}/charges/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': process.env.HUPAY_ACCESS_KEY,
        'X-Secret-Key': process.env.HUPAY_SECRET_KEY
      },
      body: JSON.stringify(body)
    });

    const data = await hupay.json().catch(() => null);
    if (!hupay.ok || !data || data.success === false) {
      return { statusCode: hupay.status || 500, headers: cors, body: JSON.stringify(data || {success:false}) };
    }

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({
        success: true,
        data: {
          qrcode: data?.data?.qrcode,
          txid: data?.data?.txid,
          amount: data?.data?.amount,
          status: data?.data?.status
        }
      })
    };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ success:false, message:'Erro interno' }) };
  }
};
