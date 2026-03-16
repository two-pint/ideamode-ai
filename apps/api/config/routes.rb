Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  # JSON health check for Next.js/Expo and load balancers
  get "health", to: "health#show"

  # Authentication
  post "auth/register", to: "auth#register"
  post "auth/login", to: "auth#login"
  get  "auth/me", to: "auth#me"
  post "auth/set_username", to: "auth#set_username"
  get  "auth/check_username", to: "auth#check_username"

  # Google OAuth (OmniAuth handles /auth/google_oauth2 internally)
  get "auth/google", to: "oauth#google"
  get "auth/google/callback", to: "oauth#google_callback"
  get "auth/google/failure", to: "oauth#google_failure"
  post "auth/exchange_code", to: "oauth#exchange_code"

  # Ideas
  get "ideas", to: "ideas#index"
  get "ideas/shared", to: "ideas#shared"
  post "ideas", to: "ideas#create"
  get "ideas/:username/:slug", to: "ideas#show"
  patch "ideas/:username/:slug", to: "ideas#update"
  delete "ideas/:username/:slug", to: "ideas#destroy"

  # Public profile scoped by username
  get "users/:username", to: "users#show"
  get "users/:username/ideas", to: "users#ideas"
end
