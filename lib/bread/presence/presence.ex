defmodule Bread.Presence do
  use Phoenix.Presence, otp_app: :bread,
                        pubsub_server: Bread.PubSub

  
end