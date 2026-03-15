# frozen_string_literal: true

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
    ENV["GOOGLE_CLIENT_ID"],
    ENV["GOOGLE_CLIENT_SECRET"],
    {
      scope: "email,profile",
      prompt: "select_account",
      callback_path: "/auth/google/callback"
    }
end

# GET is used so "Sign in with Google" can be a simple link/redirect; POST-only would
# require form or fetch from the frontend. Allowing GET weakens CSRF posture for the
# OAuth initiation step; consider moving to POST-only when frontend can trigger via POST.
OmniAuth.config.allowed_request_methods = %i[get post]
OmniAuth.config.silence_get_warning = true
