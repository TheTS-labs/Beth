#!/bin/sh

source ../env/.frontend.env

yarn workspace frontend next start -p ${NEXT_PORT}