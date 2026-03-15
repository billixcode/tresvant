import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseBuffer } from "npm:music-metadata";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { storage_path, track_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the audio file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("audio")
      .download(storage_path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    const buffer = new Uint8Array(await fileData.arrayBuffer());
    const ext = storage_path.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      mp3: "audio/mpeg",
      flac: "audio/flac",
      wav: "audio/wav",
      m4a: "audio/mp4",
      ogg: "audio/ogg",
    };

    const metadata = await parseBuffer(buffer, { mimeType: mimeTypes[ext] || "audio/mpeg" });

    const extracted: Record<string, unknown> = {};

    if (metadata.common.title) {
      extracted.title = metadata.common.title;
    }
    if (metadata.common.album) {
      extracted.album = metadata.common.album;
    }
    if (metadata.format.duration) {
      extracted.duration_secs = Math.round(metadata.format.duration);
    }
    if (metadata.common.bpm) {
      extracted.tempo_bpm = metadata.common.bpm;
    }
    if (metadata.common.key) {
      extracted.key = metadata.common.key;
    }
    if (metadata.common.genre && metadata.common.genre.length > 0) {
      extracted.genre = metadata.common.genre;
    }

    // Update the track record with extracted metadata
    const { error: updateError } = await supabase
      .from("tracks")
      .update(extracted)
      .eq("id", track_id);

    if (updateError) {
      throw new Error(`Failed to update track: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
