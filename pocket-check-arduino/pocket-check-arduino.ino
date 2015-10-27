/*********************************************************************
 This is an example for our nRF51822 based Bluefruit LE modules

 Pick one up today in the adafruit shop!

 Adafruit invests time and resources providing this open source code,
 please support Adafruit and open-source hardware by purchasing
 products from Adafruit!

 MIT license, check LICENSE for more information
 All text above, and the splash screen below must be included in
 any redistribution
*********************************************************************/

#include <Arduino.h>
#include <SPI.h>
#if not defined (_VARIANT_ARDUINO_DUE_X_) && not defined (_VARIANT_ARDUINO_ZERO_)
#include <SoftwareSerial.h>
#endif

#include "Adafruit_BLE.h"
#include "Adafruit_BluefruitLE_SPI.h"
#include "Adafruit_BluefruitLE_UART.h"

#include "BluefruitConfig.h"

#define FACTORYRESET_ENABLE         0
#define MINIMUM_FIRMWARE_VERSION    "0.6.6"
#define MODE_LED_BEHAVIOUR          "MODE"

#define BLUEFRUIT_HWSERIAL_NAME           Serial1
#define BLUEFRUIT_UART_MODE_PIN         -1   // Not used with FLORA
#define BLUEFRUIT_UART_CTS_PIN          -1   // Not used with FLORA
#define BLUEFRUIT_UART_RTS_PIN          -1   // Not used with FLORA

// Create the bluefruit object, with hardware serial, which does not need the RTS/CTS pins. */
Adafruit_BluefruitLE_UART ble(Serial1, BLUEFRUIT_UART_MODE_PIN);

/**************************************************************************/

//NeoPixel Setup
#include <Adafruit_NeoPixel.h>
#include <avr/power.h>
#define PIN            10
#define NUMPIXELS      5

Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);

//Address specific pixel for corresponding item
#define phonePixel 0
#define umbrellaPixel 3
boolean rain = false;

//Button for checking
#define buttonPin 6
int buttonState = 1;
//boolean newBuffer = false;
boolean startRanging = 1;
long startTime;

/**************************************************************************/

// A small helper
void error(const __FlashStringHelper*err) {
  Serial.println(err);
  while (1);
}

/**************************************************************************/
/*!
    @brief  Sets up the HW an the BLE module (this function is called
            automatically on startup)
*/
/**************************************************************************/
void setup(void)
{
  pinMode(buttonPin, INPUT);
  pixels.begin(); // This initializes the NeoPixel library.

  //while (!Serial);  // required for Flora & Micro
  //899delay(500);

  Serial.begin(115200);
  Serial.println(F("Adafruit Bluefruit Command Mode Example"));
  Serial.println(F("---------------------------------------"));

  /* Initialise the module */
  Serial.print(F("Initialising the Bluefruit LE module: "));

  if ( !ble.begin(VERBOSE_MODE) )
  {
    error(F("Couldn't find Bluefruit, make sure it's in CoMmanD mode & check wiring?"));
  }
  Serial.println( F("OK!") );

  if ( FACTORYRESET_ENABLE )
  {
    /* Perform a factory reset to make sure everything is in a known state */
    Serial.println(F("Performing a factory reset: "));
    if ( ! ble.factoryReset() ) {
      error(F("Couldn't factory reset"));
    }
  }


  /* Disable command echo from Bluefruit */
  ble.echo(false);

  Serial.println("Requesting Bluefruit info:");
  /* Print Bluefruit information */
  ble.info();

  Serial.println(F("Please use Adafruit Bluefruit LE app to connect in UART mode"));
  Serial.println(F("Then Enter characters to send to Bluefruit"));
  Serial.println();

  ble.verbose(false);  // debug info is a little annoying after this point!

  /* Wait for connection */
  while (! ble.isConnected()) {
    delay(500);
  }

  // LED Activity command is only supported from 0.6.6
  if ( ble.isVersionAtLeast(MINIMUM_FIRMWARE_VERSION) )
  {
    // Change Mode LED Activity
    Serial.println(F("******************************"));
    Serial.println(F("Change LED activity to " MODE_LED_BEHAVIOUR));
    ble.sendCommandCheckOK("AT+HWModeLED=" MODE_LED_BEHAVIOUR);
    Serial.println(F("******************************"));
  }
}

/**************************************************************************/
/*!
    @brief  Constantly poll for new command or response data
*/
/**************************************************************************/
void loop(void)
{

  //Check for button
  buttonState = digitalRead(buttonPin);

  // Check for user input
  //  char inputs[BUFSIZE + 1];
  //
  //  if ( getUserInput(inputs, BUFSIZE) )
  //  {
  //    // Send characters to Bluefruit
  //    Serial.print("[Send] ");
  //    Serial.println(inputs);
  //
  //    ble.print("AT+BLEUARTTX=");
  //    ble.println(inputs);
  //  }

  if (buttonState == LOW) {
    //button sends message to ble

    if (startRanging == 1) {
      startTime = millis();
      for (int i = 0; i < 5; i++) {
        pixels.setPixelColor(i, pixels.Color(50, 50, 0));
        pixels.show();
      }
      ble.println( F("AT+BLEUARTTX=C") );
      Serial.println("c");
      startRanging = 0;
    }
  }

  // Check for incoming characters from Bluefruit
  ble.println("AT+BLEUARTRX");
  ble.readline();
  if (strcmp(ble.buffer, "OK") == 0) {
    // no data
    return;
  }
  // Some data was found, its in the buffer
  Serial.print(F("[Recv] ")); Serial.println(ble.buffer);

  startRanging = 1;
  if (ble.buffer > 0) {
    String inString = String(ble.buffer);
    Serial.println("string is " + inString);
    //    if(inString.charAt(0) == 'a'){
    //      pixels.setPixelColor(0, pixels.Color(0, 150, 50));
    //      pixels.show();
    //    }
    for (int i = 0; i < inString.length(); i++) {
      if (inString.charAt(i) == 'a') {
        //wallet on
        pixels.setPixelColor(1, pixels.Color(0, 150, 50));
        pixels.show();
      } else if (inString.charAt(i) == 'b') {
        //wallet off
        pixels.setPixelColor(1, pixels.Color(150, 0, 0));
        pixels.show();
      }
      if (inString.charAt(i) == 'c') {
        //key on
        pixels.setPixelColor(2, pixels.Color(0, 150, 0));
        pixels.show();
      } else if (inString.charAt(i) == 'd') {
        //key off
        pixels.setPixelColor(2, pixels.Color(150, 0, 0));
        pixels.show();
      }
      if (inString.charAt(i) == 'e') {
        //umbrella on
        pixels.setPixelColor(3, pixels.Color(0, 150, 0));
        pixels.show();
      } else if (inString.charAt(i) == 'f') {
        //umbrella off
        pixels.setPixelColor(3, pixels.Color(150, 0, 0));
        pixels.show();
      }
      if (inString.charAt(i) == 'g') {
        //item on
        pixels.setPixelColor(4, pixels.Color(0, 150, 0));
        pixels.show();
      } else if (inString.charAt(i) == 'h') {
        //item off
        pixels.setPixelColor(4, pixels.Color(150, 0, 0));
        pixels.show();
      }
    }
  }
  if ((millis() - startTime) > 3000) {
    for (int i = 0; i < 5; i++) {
      pixels.setPixelColor(i, pixels.Color(0, 0, 0));
      pixels.show();
    }

  }
  ble.waitForOK();

}

/**************************************************************************/
/*!
    @brief  Checks for user input (via the Serial Monitor)
*/
/**************************************************************************/
bool getUserInput(char buffer[], uint8_t maxSize)
{
  // timeout in 100 milliseconds
  TimeoutTimer timeout(100);

  memset(buffer, 0, maxSize);
  while ( (Serial.peek() < 0) && !timeout.expired() ) {}

  if ( timeout.expired() ) return false;

  delay(2);
  uint8_t count = 0;
  do
  {
    count += Serial.readBytes(buffer + count, maxSize);
    delay(2);
  } while ( (count < maxSize) && !(Serial.peek() < 0) );

  return true;
}
