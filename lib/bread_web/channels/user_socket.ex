defmodule BreadWeb.UserSocket do
  use Phoenix.Socket

  ## Channels
  # channel "room:*", BreadWeb.RoomChannel
  channel "chat:*", BreadWeb.Chat
  channel "room:*", BreadWeb.Room

  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error`.
  #
  # See `Phoenix.Token` documentation for examples in
  # performing token verification on connect.

  def connect(%{"token" => token}, socket, _connect_info) do
    case Coherence.verify_user_token(socket, token, &assign/3) do
      {:error, _} -> {:ok, socket}
      {:ok, socket} -> 
        {:ok, user} = Bread.Accounts.get_user({:id, socket.assigns[:user_id]})
        userVisible = %{
          name: user.name,
          id: user.id
        }
        connection_id = :crypto.strong_rand_bytes(10) |> Base.url_encode64 |> binary_part(0, 10)
        socket = socket
          |> assign(:current_user, userVisible)
          |> assign(:connection_id, connection_id)
        {:ok, socket}
    end
  end

  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  # Socket id's are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     BreadWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  def id(_socket), do: nil
end
