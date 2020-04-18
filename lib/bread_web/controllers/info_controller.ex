
defmodule BreadWeb.InfoController do
  use BreadWeb, :controller

  def about(conn, _params) do

    render(conn, "about.html")
  end

  def terms(conn, _params) do

    render(conn, "terms.html")
  end

  def privacy(conn, _params) do

    render(conn, "privacy.html")
  end
end
