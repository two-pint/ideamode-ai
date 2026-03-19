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

  # Invites (list mine, show by token, accept)
  get "me/invites", to: "invites#index"
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

    post ":username/brainstorms/:slug/create-idea", to: "brainstorms#create_idea"

    get ":username/brainstorms/:slug/resources", to: "brainstorm_resources#index"
    post ":username/brainstorms/:slug/resources", to: "brainstorm_resources#create"
    patch ":username/brainstorms/:slug/resources/:id", to: "brainstorm_resources#update"
    delete ":username/brainstorms/:slug/resources/:id", to: "brainstorm_resources#destroy"

    get ":username/brainstorms/:slug/chat/session", to: "chat_sessions#show"
    post ":username/brainstorms/:slug/chat/session/messages", to: "chat_sessions#create_message"
    post ":username/brainstorms/:slug/chat/session/pin", to: "chat_sessions#pin"

    get ":username/brainstorms/:slug/note", to: "brainstorm_notes#show"
    put ":username/brainstorms/:slug/note", to: "brainstorm_notes#update"

    get ":username/brainstorms/:slug/research", to: "brainstorm_research#index"
    post ":username/brainstorms/:slug/research", to: "brainstorm_research#create"
    get ":username/brainstorms/:slug/research/:id", to: "brainstorm_research#show"

    # Ideas
    get ":username/ideas/:slug", to: "ideas#show"
    patch ":username/ideas/:slug", to: "ideas#update"
    delete ":username/ideas/:slug", to: "ideas#destroy"
    get ":username/ideas/:slug/members", to: "members#index", defaults: { resource_type: "idea" }
    post ":username/ideas/:slug/members", to: "members#create", defaults: { resource_type: "idea" }
    patch ":username/ideas/:slug/members/:id", to: "members#update", defaults: { resource_type: "idea" }
    delete ":username/ideas/:slug/members/:id", to: "members#destroy", defaults: { resource_type: "idea" }

    get ":username/ideas/:slug/discussion/sessions", to: "discussion_sessions#index"
    post ":username/ideas/:slug/discussion/sessions", to: "discussion_sessions#create"
    get ":username/ideas/:slug/discussion/sessions/current", to: "discussion_sessions#show", defaults: { id: "current" }
    get ":username/ideas/:slug/discussion/sessions/:id", to: "discussion_sessions#show"
    post ":username/ideas/:slug/discussion/sessions/:id/messages", to: "discussion_sessions#create_message"
    post ":username/ideas/:slug/discussion/sessions/:id/pin", to: "discussion_sessions#pin"

    get ":username/ideas/:slug/analyses", to: "idea_analyses#index"
    post ":username/ideas/:slug/analyses", to: "idea_analyses#create"
    get ":username/ideas/:slug/analyses/:id", to: "idea_analyses#show"
    patch ":username/ideas/:slug/analyses/:id", to: "idea_analyses#update"

    get ":username/ideas/:slug/note", to: "idea_notes#show"
    put ":username/ideas/:slug/note", to: "idea_notes#update"

    get ":username/ideas/:slug/tasks", to: "idea_tasks#index"
    post ":username/ideas/:slug/tasks", to: "idea_tasks#create"
    patch ":username/ideas/:slug/tasks/:id", to: "idea_tasks#update"
    delete ":username/ideas/:slug/tasks/:id", to: "idea_tasks#destroy"

    get ":username/ideas/:slug/wireframes", to: "idea_wireframes#index"
    post ":username/ideas/:slug/wireframes", to: "idea_wireframes#create"
    get ":username/ideas/:slug/wireframes/:id", to: "idea_wireframes#show"
    patch ":username/ideas/:slug/wireframes/:id", to: "idea_wireframes#update"

    get ":username/ideas/:slug/prds", to: "idea_prds#index"
    post ":username/ideas/:slug/prds", to: "idea_prds#create"
    get ":username/ideas/:slug/prds/:id", to: "idea_prds#show"
    patch ":username/ideas/:slug/prds/:id", to: "idea_prds#update"
    get ":username/ideas/:slug/prds/:id/export", to: "idea_prds#export"
  end
end
