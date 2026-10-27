"""Pruebas del endpoint SOAP. Se simula el servicio externo para no depender de internet."""
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from rest_framework.test import APITestCase
from zeep.exceptions import Fault


def fake_client(info):
    client = MagicMock()
    client.service.FullCountryInfo.return_value = info
    return client


MEXICO = SimpleNamespace(
    sISOCode="MX",
    sName="Mexico",
    sCapitalCity="Mexico City",
    sContinentCode="AM",
    sCurrencyISOCode="MXN",
    sPhoneCode="52",
    sCountryFlag="http://www.oorsprong.org/WebSamples.CountryInfo/Images/Mexico.jpg",
)


class SoapCountryTests(APITestCase):
    url = "/api/v1/soap/country/{}/"

    @patch("users.soap.get_soap_client")
    def test_pais_valido(self, get_client):
        get_client.return_value = fake_client(MEXICO)
        res = self.client.get(self.url.format("mx"))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["country"]["currency"], "MXN")
        get_client.return_value.service.FullCountryInfo.assert_called_once_with(sCountryISOCode="MX")

    @patch("users.soap.get_soap_client")
    def test_pais_inexistente(self, get_client):
        get_client.return_value = fake_client(SimpleNamespace(sName="Country not found in the database"))
        res = self.client.get(self.url.format("ZZ"))
        self.assertEqual(res.status_code, 404)

    def test_codigo_invalido(self):
        res = self.client.get(self.url.format("MEX"))
        self.assertEqual(res.status_code, 400)

    @patch("users.soap.get_soap_client")
    def test_servicio_caido(self, get_client):
        get_client.side_effect = OSError("sin conexion")
        res = self.client.get(self.url.format("MX"))
        self.assertEqual(res.status_code, 502)

    @patch("users.soap.get_soap_client")
    def test_fault_soap(self, get_client):
        client = MagicMock()
        client.service.FullCountryInfo.side_effect = Fault("error del servidor")
        get_client.return_value = client
        res = self.client.get(self.url.format("MX"))
        self.assertEqual(res.status_code, 502)
