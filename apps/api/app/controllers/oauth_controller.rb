# frozen_string_literal: true

class OauthController < ApplicationController
  def google
    redirect_to "/auth/google_oauth2", allow_other_host: true
  end

  def google_callback
    auth = request.env["omniauth.auth"]

    unless auth
      redirect_to_frontend_with_error("Authentication failed")
      return
    end

    user = find_or_create_user_from_google(auth)

    if user.persisted?
      token = JwtService.encode(user.id)
      redirect_to_frontend_with_token(token)
    else
      redirect_to_frontend_with_error(user.errors.full_messages.join(", "))
    end
  end

  def google_failure
    redirect_to_frontend_with_error(params[:message] || "Authentication failed")
  end

  private

  def find_or_create_user_from_google(auth)
    info = auth.info
    uid = auth.uid

    user = User.find_by(google_uid: uid)
    return user if user

    user = User.find_by(email: info.email)
    if user
      user.update!(google_uid: uid, avatar_url: user.avatar_url || info.image)
      return user
    end

    User.create!(
      email: info.email,
      google_uid: uid,
      name: info.name,
      avatar_url: info.image
    )
  end

  def frontend_url
    ENV.fetch("FRONTEND_URL", "http://localhost:8080")
  end

  def redirect_to_frontend_with_token(token)
    redirect_to "#{frontend_url}/auth/callback?token=#{token}", allow_other_host: true
  end

  def redirect_to_frontend_with_error(message)
    redirect_to "#{frontend_url}/auth/callback?error=#{CGI.escape(message)}", allow_other_host: true
  end
end
