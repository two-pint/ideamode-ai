# frozen_string_literal: true

class JwtService
  ALGORITHM = "HS256"
  EXPIRY = 24.hours

  class << self
    def encode(user_id)
      payload = {
        sub: user_id,
        exp: EXPIRY.from_now.to_i,
        iat: Time.current.to_i
      }
      JWT.encode(payload, secret, ALGORITHM)
    end

    def decode(token)
      decoded = JWT.decode(token, secret, true, algorithm: ALGORITHM)
      decoded.first
    rescue JWT::DecodeError
      nil
    end

    private

    def secret
      Rails.application.credentials.secret_key_base ||
        ENV.fetch("JWT_SECRET") { raise "JWT secret not configured" }
    end
  end
end
