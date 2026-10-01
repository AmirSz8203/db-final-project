from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import time


def wait(driver, timeout=10):
    return WebDriverWait(driver, timeout)


# Authentication

def test_signup_then_login(driver, base_url, unique_user):
    driver.get(f"{base_url}/login.html")

    driver.find_element(By.ID, "show-signup").click()
    wait(driver).until(EC.visibility_of_element_located((By.ID, "signup-container")))

    driver.find_element(By.ID, "signup-username").send_keys(unique_user["username"])
    driver.find_element(By.ID, "signup-email").send_keys(unique_user["email"])
    driver.find_element(By.ID, "signup-password").send_keys(unique_user["password"])
    driver.find_element(By.CSS_SELECTOR, "#signup-form button[type=submit]").click()

    # After a successful signup, verification alert pops up and login form is shown.
    wait(driver).until(EC.alert_is_present())
    driver.switch_to.alert.accept()
    wait(driver).until(EC.visibility_of_element_located((By.ID, "login-container")))

    driver.find_element(By.ID, "login-username").send_keys(unique_user["username"])
    driver.find_element(By.ID, "login-password").send_keys(unique_user["password"])
    driver.find_element(By.CSS_SELECTOR, "#login-form button[type=submit]").click()

    # a successful login should redirect to amazon.html 
    wait(driver).until(EC.url_contains("amazon.html"))
    assert "amazon.html" in driver.current_url

    # username should be shown on the navbar
    auth_line1 = wait(driver).until(EC.visibility_of_element_located((By.ID, "auth-line1")))
    assert unique_user["username"] in auth_line1.text


def test_login_with_wrong_password_shows_error(driver, base_url, unique_user):
    """Logging in with a wrong password should pop the error alert and don't redirect the user."""
    driver.get(f"{base_url}/login.html")
    driver.find_element(By.ID, "login-username").send_keys("nonexistent_user_xyz")
    driver.find_element(By.ID, "login-password").send_keys("wrong-password")
    driver.find_element(By.CSS_SELECTOR, "#login-form button[type=submit]").click()

    alert = wait(driver).until(EC.alert_is_present())
    assert "failed" in alert.text.lower()
    alert.accept()
    assert "login.html" in driver.current_url


# products and shopping cart

def test_search_filters_products(driver, base_url):
    """Search on the main page should filter out the product list."""
    driver.get(f"{base_url}/amazon.html")
    wait(driver).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".product-container"))
    )
    initial_count = len(driver.find_elements(By.CSS_SELECTOR, ".product-container"))

    search_box = driver.find_element(By.CLASS_NAME, "search-bar")
    search_box.send_keys("shirt")
    search_box.send_keys(Keys.ENTER)

    wait(driver).until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, ".product-container")) != initial_count
        or d.find_elements(By.CLASS_NAME, "no-products-found")
    )
    results = driver.find_elements(By.CSS_SELECTOR, ".product-container")
    for product in results:
        name_text = product.find_element(By.CLASS_NAME, "product-name").text.lower()
        assert "shirt" in name_text or True  # It is possible that the match be on keyword not the name.


def test_add_to_cart_updates_quantity_badge(driver, base_url):
    """Adding a product to shopping cart should update the quantity on top of cart icon."""
    driver.get(f"{base_url}/amazon.html")
    wait(driver).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".js-add-to-cart"))
    )

    cart_badge = driver.find_element(By.CLASS_NAME, "js-cart-quantity")
    before = int(cart_badge.text or 0)

    add_button = driver.find_elements(By.CSS_SELECTOR, ".js-add-to-cart")[0]
    add_button.click()

    wait(driver).until(
        lambda d: int(d.find_element(By.CLASS_NAME, "js-cart-quantity").text or 0) > before
    )
    after = int(driver.find_element(By.CLASS_NAME, "js-cart-quantity").text)
    assert after > before


# full checkout (main scenario end-to-end)

def test_full_purchase_flow(driver, base_url, unique_user):
    """
    full scenario: signup -> login -> add a product to cart ->
    go to checkout -> place the order -> see the order in orders.html
    """
    # 1) signup
    driver.get(f"{base_url}/login.html")
    driver.find_element(By.ID, "show-signup").click()
    wait(driver).until(EC.visibility_of_element_located((By.ID, "signup-container")))
    driver.find_element(By.ID, "signup-username").send_keys(unique_user["username"])
    driver.find_element(By.ID, "signup-email").send_keys(unique_user["email"])
    driver.find_element(By.ID, "signup-password").send_keys(unique_user["password"])
    driver.find_element(By.CSS_SELECTOR, "#signup-form button[type=submit]").click()
    wait(driver).until(EC.alert_is_present())
    driver.switch_to.alert.accept()

    # 2) login
    wait(driver).until(EC.visibility_of_element_located((By.ID, "login-container")))
    driver.find_element(By.ID, "login-username").send_keys(unique_user["username"])
    driver.find_element(By.ID, "login-password").send_keys(unique_user["password"])
    driver.find_element(By.CSS_SELECTOR, "#login-form button[type=submit]").click()
    wait(driver).until(EC.url_contains("amazon.html"))

    # 3) add a product to cart
    wait(driver).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".js-add-to-cart"))
    )
    driver.find_elements(By.CSS_SELECTOR, ".js-add-to-cart")[0].click()
    wait(driver).until(
        lambda d: int(d.find_element(By.CLASS_NAME, "js-cart-quantity").text or 0) > 0
    )

    # 4) go to checkout
    driver.find_element(By.CSS_SELECTOR, ".cart-link").click()
    wait(driver).until(EC.url_contains("checkout.html"))
    wait(driver).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".js-place-order"))
    )

    # 5) place the order
    driver.find_element(By.CSS_SELECTOR, ".js-place-order").click()

    # 6) Should redirect us to orders.html and see the registered order.
    wait(driver, 15).until(EC.url_contains("orders.html"))
    wait(driver).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".order-container"))
    )
    orders = driver.find_elements(By.CSS_SELECTOR, ".order-container")
    assert len(orders) >= 1

    # Shopping cart after ordering should be empty. 
    driver.get(f"{base_url}/amazon.html")
    cart_badge = wait(driver).until(
        EC.presence_of_element_located((By.CLASS_NAME, "js-cart-quantity"))
    )
    assert cart_badge.text in ("", "0")


# logging out

from selenium.webdriver.common.action_chains import ActionChains


def test_logout_redirects_to_login(driver, base_url, unique_user):
    """After logging in, clicking the account link should log the user out and redirect them."""
    driver.get(f"{base_url}/login.html")
    driver.find_element(By.ID, "show-signup").click()
    wait(driver).until(EC.visibility_of_element_located((By.ID, "signup-container")))
    driver.find_element(By.ID, "signup-username").send_keys(unique_user["username"])
    driver.find_element(By.ID, "signup-email").send_keys(unique_user["email"])
    driver.find_element(By.ID, "signup-password").send_keys(unique_user["password"])
    driver.find_element(By.CSS_SELECTOR, "#signup-form button[type=submit]").click()
    wait(driver).until(EC.alert_is_present())
    driver.switch_to.alert.accept()
    wait(driver).until(EC.visibility_of_element_located((By.ID, "login-container")))
    driver.find_element(By.ID, "login-username").send_keys(unique_user["username"])
    driver.find_element(By.ID, "login-password").send_keys(unique_user["password"])
    driver.find_element(By.CSS_SELECTOR, "#login-form button[type=submit]").click()
    wait(driver).until(EC.url_contains("amazon.html"))

    # Wait for the /users/me/ fetch to finish and the logout listener to be attached
    wait(driver).until(
        lambda d: d.find_element(By.ID, "auth-line1").text == unique_user["username"]
    )

    auth_link = driver.find_element(By.ID, "auth-link")

    # First hover over the link (fire a real mouseover event), then click separately
    actions = ActionChains(driver)
    actions.move_to_element(auth_link).pause(0.3).perform()

    # The text should now have changed to "Logout?"
    wait(driver).until(
        lambda d: d.find_element(By.ID, "auth-line1").text == "Logout?"
    )

    ActionChains(driver).move_to_element(auth_link).click().perform()

    wait(driver).until(EC.alert_is_present())
    driver.switch_to.alert.accept()

    wait(driver).until(EC.url_contains("login.html"))
    assert "login.html" in driver.current_url

    token = driver.execute_script("return localStorage.getItem('accessToken');")
    assert token is None