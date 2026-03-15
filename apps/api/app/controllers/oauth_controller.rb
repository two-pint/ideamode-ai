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
      code = SecureRandom.urlsafe_base64(32)
      Rails.cache.write("oauth_code:#{code}", token, expires_in: 5.minutes)
      redirect_to_frontend_with_code(code)
    else
      redirect_to_frontend_with_error(user.errors.full_messages.join(", "))
    end
  end

  def google_failure
    redirect_to_frontend_with_error(params[:message] || "Authentication failed")
  end

  def exchange_code
    code = params[:code]
    token = code.present? && Rails.cache.read("oauth_code:#{code}")
    Rails.cache.delete("oauth_code:#{code}") if code.present?

    unless token
      render json: { error: "Invalid or expired code" }, status: :unauthorized
      return
    end

    payload = JwtService.decode(token)
    user = payload && User.find_by(id: payload["sub"])

    unless user
      render json: { error: "Invalid token" }, status: :unauthorized
      return
    end

    render json: { token: token, user: user_json(user) }
  end

  private

  def user_json(user)
    {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      has_password: user.password_digest.present?
    }
  end

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

  def redirect_to_frontend_with_code(code)
    redirect_to "#{frontend_url}/auth/callback?code=#{CGI.escape(code)}", allow_other_host: true
  end

  def redirect_to_frontend_with_error(message)
    redirect_to "#{frontend_url}/auth/callback?error=#{CGI.escape(message)}", allow_other_host: true
  end
end
