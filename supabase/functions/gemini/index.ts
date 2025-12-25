import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    console.log(`${req.method} request to gemini function`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Handle GET for health check
    if (req.method === 'GET') {
        return new Response(JSON.stringify({ status: 'ok', message: 'Gemini function is active' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    }

    try {
        const body = await req.json().catch(() => null);
        if (!body || !body.contents) {
            return new Response(JSON.stringify({ error: 'Missing contents in request body' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        const { contents } = body;
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set in Edge Function secrets' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            })
        }

        const model = 'gemini-2.5-flash-lite'
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents })
        })

        const data = await response.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.status
        })

    } catch (error) {
        console.error('Function error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
