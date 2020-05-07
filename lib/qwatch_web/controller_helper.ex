defmodule QwatchWeb.Controller.Helper do
  def redirect_to_back(conn) do
    path =
      conn
      |> Plug.Conn.get_req_header("referer")
      |> URI.parse()
      |> Map.get(:path)

    path = path || "/"

    conn
    |> Phoenix.Controller.redirect(to: path)
  end

  def page_offset page, page_size do
    page = if page && match?({_, ""}, Integer.parse(page)), do: String.to_integer(page), else: 1
    if page < 1, do: 0, else: (page-1)*page_size
  end

  def update_user_logins(user_id) do
    recipient = Qwatch.Accounts.get_user({:id, user_id})
    case recipient do
      {:ok, user} -> Coherence.update_user_logins(user)
      _ -> nil
    end
  end

  def update_user_login(conn, user_id) do
    recipient = Qwatch.Accounts.get_user({:id, user_id})
    case recipient do
      {:ok, user} -> Coherence.update_user_login(conn, user)
      _ -> nil
    end
  end
end
