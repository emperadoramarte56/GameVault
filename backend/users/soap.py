"""Consumo de un servicio SOAP público desde Django usando zeep.

Servicio: CountryInfoService (gratuito, sin clave).
WSDL: http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL

Uso en GameVault: dado el código de país de un jugador (MX, US, ES...), devuelve
el país, su capital y la moneda en la que se pagan los juegos.
"""
import re

from drf_yasg.utils import swagger_auto_schema
from requests import Session
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from zeep import Client
from zeep.exceptions import Fault, TransportError
from zeep.transports import Transport

WSDL_URL = (
    "http://webservices.oorsprong.org/websamples.countryinfo/"
    "CountryInfoService.wso?WSDL"
)
TIMEOUT_SECONDS = 15
ISO_CODE = re.compile(r"^[A-Za-z]{2}$")


def get_soap_client():
    """Crea el cliente SOAP (descarga y lee el WSDL del servicio)."""
    transport = Transport(session=Session(), timeout=TIMEOUT_SECONDS, operation_timeout=TIMEOUT_SECONDS)
    return Client(WSDL_URL, transport=transport)


class CountryInfoSoapView(APIView):
    """Consulta un país en un servicio SOAP externo (público, no requiere token)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @swagger_auto_schema(operation_summary="Datos de un país vía SOAP (zeep)")
    def get(self, request, iso_code):
        if not ISO_CODE.match(iso_code):
            return Response(
                {"detail": "El código de país debe tener 2 letras (ej. MX, US, ES)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        iso_code = iso_code.upper()

        try:
            client = get_soap_client()
            # Operación SOAP: FullCountryInfo(sCountryISOCode)
            info = client.service.FullCountryInfo(sCountryISOCode=iso_code)
        except (Fault, TransportError, OSError) as exc:
            return Response(
                {"detail": "No se pudo consultar el servicio SOAP externo.", "error": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Si el código no existe, el servicio responde con un nombre de aviso.
        if info is None or not getattr(info, "sName", None) or "not found" in info.sName.lower():
            return Response(
                {"detail": f"No existe el país con código {iso_code}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "source": "SOAP · CountryInfoService",
                "wsdl": WSDL_URL,
                "operation": "FullCountryInfo",
                "country": {
                    "iso_code": info.sISOCode,
                    "name": info.sName,
                    "capital": info.sCapitalCity,
                    "continent": info.sContinentCode,
                    "currency": info.sCurrencyISOCode,
                    "phone_code": info.sPhoneCode,
                    "flag": info.sCountryFlag,
                },
            }
        )
