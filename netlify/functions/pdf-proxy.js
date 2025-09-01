exports.handler = async (event, context) => {
    // Handle CORS for all requests
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    const { url } = event.queryStringParameters || {};
    
    if (!url) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'URL parameter is required' }),
        };
    }

    try {
        console.log(`Proxying request for: ${url}`);
        
        // Fetch the PDF from the original URL
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; PDF-Proxy/1.0)',
                'Accept': 'application/pdf,*/*',
            },
        });

        if (!response.ok) {
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `Failed to fetch PDF: ${response.status} ${response.statusText}` 
                }),
            };
        }

        // Get the PDF data
        const pdfBuffer = await response.arrayBuffer();
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'application/pdf',
                'Content-Length': pdfBuffer.byteLength.toString(),
            },
            body: pdfBase64,
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('PDF proxy error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to proxy PDF request',
                details: error.message 
            }),
        };
    }
};