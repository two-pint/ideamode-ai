# frozen_string_literal: true

class IdeaNote < ApplicationRecord
  belongs_to :idea
  belongs_to :user, optional: true
end
