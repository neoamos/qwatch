defmodule Bread.Presence do
  use Phoenix.Presence, otp_app: :bread,
                        pubsub_server: Bread.PubSub

  

  def update_online_users room do 
    users = Phoenix.Presence.list(Bread.Presence, room)
    count = length(Map.keys(users))
    :ets.insert(:users_online_count, {room, %{time: Timex.now(), count: count}})
    count
  end

  def get_user_count room do
    users = Phoenix.Presence.list(Bread.Presence, "chat:" <> room)
    count = length(Map.keys(users))
    count
    
    # case :ets.lookup(:users_online_count, room) do
    #   [{room, count}] -> count.count
    #   [] -> 0
    # end
  end


end