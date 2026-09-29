/**
 * Diagnóstico de configuración Brevo
 * Verifica: variables de entorno, conexión API, listas existentes
 */

async function diagnoseBrevo() {
  const apiKey = process.env.BREVO_API_KEY;

  console.log("🔍 Diagnóstico Brevo");
  console.log("═══════════════════════");

  if (!apiKey) {
    console.error("❌ BREVO_API_KEY no configurada");
    process.exit(1);
  }

  console.log("✅ BREVO_API_KEY presente");

  // Verificar conexión
  try {
    const response = await fetch("https://api.brevo.com/v3/contacts/lists", {
      headers: { "api-key": apiKey },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API accesible · ${data.lists?.length || 0} listas`);
    } else {
      console.error(`❌ API error: ${response.status}`);
    }
  } catch (err) {
    console.error("❌ Error de conexión a Brevo");
  }
}

diagnoseBrevo();
