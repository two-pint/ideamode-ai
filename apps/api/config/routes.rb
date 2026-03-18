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

  # Brainstorms (list/create)
  get "brainstorms", to: "brainstorms#index"
  get "brainstorms/shared", to: "brainstorms#shared"
  post "brainstorms", to: "brainstorms#create"

  # Ideas (list/create)
  get "ideas", to: "ideas#index"
  get "ideas/shared", to: "ideas#shared"
  post "ideas", to: "ideas#create"

  # User profile
  get "users/:username", to: "users#show"
  get "users/:username/ideas", to: "users#ideas"
  get "users/:username/brainstorms", to: "users#brainstorms"

  # Invites (accept by token)
  get "invites/:token", to: "invites#show"
  post "invites/:token/accept", to: "invites#accept"

  # Namespaced resource routes: /:username/brainstorms/:slug and /:username/ideas/:slug
  # Constraints ensure :username doesn't match literal route segments
  constraints username: /[a-zA-Z0-9_-]+/, slug: /[a-z0-9-]+/ do
    # Brainstorms
    get ":username/brainstorms/:slug", to: "brainstorms#show"
    patch ":username/brainstorms/:slug", to: "brainstorms#update"
    delete ":username/brainstorms/:slug", to: "brainstorms#destroy"
    get ":username/brainstorms/:slug/members", to: "members#index", defaults: { resource_type: "brainstorm" }
    post ":username/brainstorms/:slug/members", to: "members#create", defaults: { resource_type: "brainstorm" }
    patch ":username/brainstorms/:slug/members/:id", to: "members#update", defaults: { resource_type: "brainstorm" }
    delete ":username/brainstorms/:slug/members/:id", to: "members#destroy", defaults: { resource_type: "brainstorm" }

    # Ideas
    get ":username/ideas/:slug", to: "ideas#show"
    patch ":username/ideas/:slug", to: "ideas#update"
    delete ":username/ideas/:slug", to: "ideas#destroy"
    get ":username/ideas/:slug/members", to: "members#index", defaults: { resource_type: "idea" }
    post ":username/ideas/:slug/members", to: "members#create", defaults: { resource_type: "idea" }
    patch ":username/ideas/:slug/members/:id", to: "members#update", defaults: { resource_type: "idea" }
    delete ":username/ideas/:slug/members/:id", to: "members#destroy", defaults: { resource_type: "idea" }
  end
end
