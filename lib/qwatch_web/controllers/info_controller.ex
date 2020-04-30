
defmodule QwatchWeb.InfoController do
  use QwatchWeb, :controller

  def about(conn, _params) do

    render(conn, "about.html", title: "About - Qwatch")
  end

  def terms(conn, _params) do

    render(conn, "terms.html", title: "Terms of Use - Qwatch")
  end

  def privacy(conn, _params) do

    render(conn, "privacy.html", title: "Privacy Policy - Qwatch")
  end
end
