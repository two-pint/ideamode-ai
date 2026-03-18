# frozen_string_literal: true

class BrainstormNote < ApplicationRecord
  belongs_to :brainstorm
  belongs_to :user, optional: true
end
