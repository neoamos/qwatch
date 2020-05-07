defmodule Qwatch.Presence do
  use Phoenix.Presence, otp_app: :qwatch,
                        pubsub_server: Qwatch.PubSub

  

  def update_online_users room do 
    users = Phoenix.Presence.list(Qwatch.Presence, room)
    count = length(Map.keys(users))
    :ets.insert(:users_online_count, {room, %{time: Timex.now(), count: count}})
    count
  end

  def get_user_count room do
    users = Phoenix.Presence.list(Qwatch.Presence, "chat:" <> room)

    users 
    |> Map.values() 
    |> Enum.filter(fn value ->
      !!Enum.at(value[:metas], 0)[:user_id]
    end)
    |> length()
    
    # case :ets.lookup(:users_online_count, room) do
    #   [{room, count}] -> count.count
    #   [] -> 0
    # end
  end


end