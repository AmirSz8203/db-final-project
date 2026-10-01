import time
import uuid
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

BASE_URL = "http://localhost:8080"
API_BASE_URL = "http://localhost:8001"


@pytest.fixture
def driver():
    options = Options()
    # options.add_argument("--headless=new")  # for headless running
    options.add_argument("--window-size=1400,1000")
    drv = webdriver.Chrome(options=options)
    yield drv
    drv.quit()


@pytest.fixture
def base_url():
    return BASE_URL


@pytest.fixture
def unique_user():
    """ Each time creates a unique user so that the tests don't collide with each other."""
    suffix = uuid.uuid4().hex[:8]
    return {
        "username": f"testuser_{suffix}",
        "email": f"testuser_{suffix}@example.com",
        "password": "TestPass123!",
    }