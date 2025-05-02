const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  const user_id = event.queryStringParameters.user_id;

  if (!user_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "user_id manquant" }),
    };
  }

  try {
    const { data, error } = await supabase
      .from("n8n_chat_history")
      .select("question, preview")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur" }),
    };
  }
};
