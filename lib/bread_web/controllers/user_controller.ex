defmodule BreadWeb.UserController do
  use BreadWeb, :controller

  alias Bread.Accounts

  def profile(conn, %{"name" => name}) do
    case Accounts.get_user({:name, name}) do
      {:ok, user} -> 
        render conn, "profile.html", user: user
      _ -> 
        conn
        |> put_flash(:error, "User does not exist")
        |> redirect(to: "/")
    end
  end
end
