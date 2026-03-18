# frozen_string_literal: true

require "test_helper"

class JwtServiceTest < ActiveSupport::TestCase
  test "encode and decode roundtrip" do
    user_id = 42
    token = JwtService.encode(user_id)
    assert token.is_a?(String)
    assert token.length > 0

    decoded = JwtService.decode(token)
    assert decoded.is_a?(Hash)
    assert_equal user_id, decoded["sub"].to_i
    assert decoded["exp"].present?
    assert decoded["iat"].present?
  end

  test "decode returns nil for invalid token" do
    assert_nil JwtService.decode("invalid.token.here")
    assert_nil JwtService.decode("")
    assert_nil JwtService.decode("not-jwt")
  end

  test "decode returns nil for tampered token" do
    token = JwtService.encode(1)
    tampered = token.split(".").tap { |p| p[1] = Base64.strict_encode64({ sub: 999 }.to_json) }.join(".")
    assert_nil JwtService.decode(tampered)
  end
end
