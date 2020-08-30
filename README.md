# marsclock
 A clock to tell the time on Mars for the Raspberry Pi

Although this is intended for the Raspberry Pi, it'll run on any platform that supports Nodejs and Electron.

Full configuration options for the RPI and installation instructions can be found [here](https://philip-p-ide.uk/doku.php/blog/articles/raspberry_pi/mclock)

For other platforms, the process summed up is to perform the following steps:
  * install nodejs if required
  * install electron (npm install -g electron)
  * clone this repository
  * step into the ./marsclock folder
  * complete installation of dependencies (npm install)
  * run the application (npm start)

You can build a package if you like, but for a dedicated Mars Clock it is not necessary.

## General
The program tells the time at any location on the Martian surface. While there are other cloks that do this, this one is highly configurable and support skins.

As well as being able to display a background image associated with the current skin, or any other image if the user desires, it can also display a map chosen to display the current location's coordinates.

You can select any of a number of preset locations, or enter new coordinates which you then have the option to save. Alternately, you can select any of the missions that arrived on the Martian surface (successfully or not).

The program updates automatically when new data is available.

## Samples

!(https://philip-p-ide.uk/lib/exe/fetch.php/blog/articles/raspberry/phys_marsclock/bg_mola_map2.png)

(https://philip-p-ide.uk/lib/exe/fetch.php/blog/articles/raspberry/phys_marsclock/bg_viking_map.png)

(https://philip-p-ide.uk/lib/exe/fetch.php/blog/articles/raspberry/phys_marsclock/skin_minimal.png)

(https://philip-p-ide.uk/lib/exe/fetch.php/blog/articles/raspberry/phys_marsclock/skin_mission1.png)

(https://philip-p-ide.uk/lib/exe/fetch.php/blog/articles/raspberry/phys_marsclock/skin_mission2.png)
