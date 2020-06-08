
defmodule QwatchWeb.InfoController do
  use QwatchWeb, :controller

  def about(conn, _params) do

    render(conn, "about.html", title: "About - Qwatch")
  end

  def terms(conn, _params) do
    render(conn,"terms.html", title: "Frequently Asked Questions")
  end

  def privacy(conn, _params) do

    render(conn, "privacy.html", title: "Privacy Policy - Qwatch")
  end

  def faq(conn, _params) do

    render(conn, "faq.html", title: "Frequently Asked Questions - Qwatch")
  end
end
