#!/bin/sh

source ../env/.frontend.env

yarn workspace frontend next dev -p ${NEXT_PORT}