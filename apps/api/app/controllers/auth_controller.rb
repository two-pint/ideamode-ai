# frozen_string_literal: true

class AuthController < ApplicationController
  include Authenticatable

  before_action :require_authentication!, only: %i[me set_username]

  def register
    user = User.new(register_params)

    if user.save
      token = JwtService.encode(user.id)
      render json: { token: token, user: user_json(user) }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def login
    user = User.find_by(email: login_params[:login]) ||
           User.find_by(username: login_params[:login])

    if user&.password_digest? && user.authenticate(login_params[:password])
      token = JwtService.encode(user.id)
      render json: { token: token, user: user_json(user) }
    else
      render json: { error: "Invalid credentials" }, status: :unauthorized
    end
  end

  def me
    render json: { user: user_json(current_user) }
  end

  def set_username
    if current_user.username.present?
      render json: { error: "Username already set" }, status: :unprocessable_entity
      return
    end

    if current_user.update(username: params[:username])
      render json: { user: user_json(current_user) }
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def check_username
    username = params[:username]

    if username.blank?
      render json: { available: false, error: "Username is required" }
      return
    end

    user = User.new(username: username)
    user.valid?
    username_errors = user.errors[:username]

    if username_errors.any?
      render json: { available: false, error: username_errors.first }
    else
      available = !User.exists?(username: username)
      render json: { available: available }
    end
  end

  private

  def register_params
    params.permit(:email, :username, :password, :name)
  end

  def login_params
    params.permit(:login, :password)
  end

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
end
